require 'pp'
require 'sinatra'
require 'uuid'
require 'aws-sdk'

require File.dirname(__FILE__)+'/lib/s3_policy_signer.rb'
require File.dirname(__FILE__)+'/lib/freemind_format.rb'
require File.dirname(__FILE__)+'/lib/browser_detection.rb'

configure do
  set :google_analytics_account, ENV["GOOGLE_ANALYTICS_ACCOUNT"]
  set :s3_website,ENV['S3_WEBSITE']
  set :base_url, ENV['SITE_URL'] || "/"
  set :s3_key_id, ENV['S3_KEY_ID']
  set :s3_form_expiry, (60*60*24*30)
  set :s3_bucket_name, ENV['S3_BUCKET_NAME']
  set :s3_secret_key, ENV['S3_SECRET_KEY']
  set :s3_upload_folder, ENV['S3_UPLOAD_FOLDER']
  set :default_map, ENV['DEFAULT_MAP']|| "map/default"
  set :s3_max_upload_size, ENV['MAX_UPLOAD_SIZE']||100
  set :max_upload_size, ENV['MAX_UPLOAD_SIZE']||100
  set :key_id_generator, UUID.new
  set :current_map_data_version, ENV['CURRENT_MAP_DATA_VERSION'] || "a1"
  set :network_timeout_millis, ENV['NETWORK_TIMEOUT_MILLIS']||10000
  offline =  ENV['OFFLINE'] || "online"
  set :online, offline == "offline" ? false : true
  AWS.config(:access_key_id=>settings.s3_key_id, :secret_access_key=>settings.s3_secret_key)
  s3=AWS::S3.new()
  set :s3_bucket, s3.buckets[settings.s3_bucket_name]
  set :root, File.dirname(__FILE__)
  set :cache_prevention_key, settings.key_id_generator.generate(:compact)
  set :static, true
end
get '/' do
  if session['mapid'].nil?
    @mapid=settings.default_map
    show_map
  else
    redirect "/map/#{session['mapid']}"
  end
end
get '/gd' do
  state = params[:state]
  begin
    mapid = "g1" + JSON.parse(params[:state])['ids'][0]
    redirect "/map/"+mapid
  rescue Exception=>e
    puts e
    halt 400, "Google drive state missing or invalid"
  end
end
get '/fb' do
	redirect "http://facebook.com/mindmupapp"
end
get '/trouble' do
 erb :trouble
end
get '/default' do
  @mapid=settings.default_map
  erb :editor
end
get "/s3/:mapid" do
  redirect "/map/#{params[:mapid]}"
end

get "/s3proxy/:mapid" do
  content_type 'application/json'
  settings.s3_bucket.objects[map_key(params[:mapid])].read
end

post "/export" do
  content_type 'application/octet-stream'
  contents=params[:map]
  json=JSON.parse(contents)
  attachment (Rack::Utils.escape(json['title'])+'.'+params[:format])
  if (params[:format] == "mm")
    FreemindFormat.new(json).to_freemind
  else
    contents
  end
end

get "/map/:mapid" do
  @mapid = params[:mapid]
  session['mapid']=@mapid
  show_map
end

get "/publishingConfig" do
  @s3_upload_identifier = settings.current_map_data_version +  settings.key_id_generator.generate(:compact)
  @s3_key=settings.s3_upload_folder+"/" + @s3_upload_identifier + ".json"
  @s3_content_type="text/plain"
  signer=S3PolicySigner.new
  @policy=signer.signed_policy settings.s3_secret_key, settings.s3_key_id, settings.s3_bucket_name, @s3_key, settings.s3_max_upload_size*1024, @s3_content_type, settings.s3_form_expiry
  erb :s3UploadConfig
end

get '/browserok/:mapid' do
  session['browserok']=true
  redirect "/map/#{params[:mapid]}"
end
post '/import' do
  file = params['file']
  json_fail('No file uploaded') unless file 
  uploaded_size=request.env['CONTENT_LENGTH']
  json_fail('Browser did not provide content length for upload') unless uploaded_size
  json_fail("File too big. Maximum size is #{settings.max_upload_size}kb") if uploaded_size.to_i>settings.max_upload_size*1024
  allowed_types=[".mm", ".mup"]
  uploaded_type= File.extname file[:filename]
  json_fail "unsupported file type #{uploaded_type}" unless allowed_types.include? uploaded_type
  result=File.readlines(file[:tempfile]).join  ' '
  content_type 'text/plain'
  result
end
get "/un" do
  erb :unsupported
end
include Sinatra::UserAgentHelpers
helpers do
  def show_map
    if (browser_supported? || user_accepted_browser?)
      erb :editor
    else
      erb :unsupported
    end
  end
  def user_accepted_browser?
    !(session["browserok"].nil?)
  end
  def browser_supported? 
    browser.chrome? || browser.gecko? || browser.safari?
  end
  def json_fail message
    halt %Q!{"error":"#{message}"}!
  end
  def map_key mapid
    (mapid.include?("/") ?  "" : settings.s3_upload_folder + "/") + mapid + ".json"
  end
  def map_url mapid
    if settings.online?
      "http://%s/%s" %  [settings.s3_website, map_key(mapid)]
    else
      "/offline/default.json"
    end
  end
  def join_scripts script_url_array
    return script_url_array if (development? || test?)
    target_file="#{settings.public_folder}/#{settings.cache_prevention_key}.js" 

    if (!File.exists? target_file) then
      script_url_array.each do |input_file|
        infile = "#{settings.public_folder}/#{input_file}"
        if !File.exists? infile then
          halt 503, "Script file not found! #{input_file}"
        end
      end
      File.open(target_file,"w") do |output_file|
        script_url_array.each do |input_file|
          infile = "#{settings.public_folder}/#{input_file}"
          content= File.readlines(infile)
          output_file.puts content
        end
      end
    end
    return ["/#{settings.cache_prevention_key}.js"] 
  end
  def load_scripts script_url_array
    script_tags=script_url_array.map do |url|
      %Q{<script>ScriptHelper.currentScript='#{url}'; ScriptHelper.expectedScripts.push('#{url}');</script>
        <script src='#{url}' onload='ScriptHelper.loadedScripts.push("#{url}")' onerror='ScriptHelper.errorScripts.push("#{url}")'></script>}
    end
   %Q^<script>
      var ScriptHelper={
        loadedScripts:[],
        expectedScripts:[],
        errorScripts:[],
        jsErrors:[],
        logError:function(message,url,line){
          ScriptHelper.jsErrors.push({'message':message, 'url':url||ScriptHelper.currentScript, 'line':line});
        },
        failed: function(){
          return ScriptHelper.errorScripts.length>0 || ScriptHelper.jsErrors.length>0 || ScriptHelper.loadedScripts.length!=#{script_url_array.length}
        },
        failedScripts: function(){
          var keys={},idx,result=[];
          for (idx in ScriptHelper.errorScripts) { keys[ScriptHelper.errorScripts[idx]]=true };
          for (idx in ScriptHelper.jsErrors) { keys[ScriptHelper.jsErrors[idx].url]=true };
          for (idx in ScriptHelper.expectedScripts) { if (ScriptHelper.loadedScripts.indexOf(ScriptHelper.expectedScripts[idx])<0) keys[ScriptHelper.expectedScripts[idx]]=true; }
          for (idx in keys) {result.push(idx)};
          return result;
        },
		loading: function(){
			return ScriptHelper.errorScripts.length==0 && ScriptHelper.jsErrors.length==0 && ScriptHelper.loadedScripts.length<ScriptHelper.expectedScripts.length;
		},
		afterLoad: function(config){
			ScriptHelper.loadWaitRetry=(ScriptHelper.loadWaitRetry||50)-1;
			if (ScriptHelper.loading() && ScriptHelper.loadWaitRetry>0){
				setTimeout( function(){ScriptHelper.afterLoad(config)},100);
			}
			else {
				if (ScriptHelper.failed()) config.fail(); else config.success();
			}
		}	
      };
      window.onerror=ScriptHelper.logError;
    </script>
    #{script_tags.join('')}
    <script>
      window.onerror=function(){};
    </script>
     ^
  end
end

