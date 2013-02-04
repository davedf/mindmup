require 'pp'
require 'sinatra'
require 'uuid'
require 'aws-sdk'

require File.dirname(__FILE__)+'/lib/s3_policy_signer.rb'
require File.dirname(__FILE__)+'/lib/freemind_format.rb'

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
    erb :editor
  else
    redirect "/map/#{session['mapid']}"
  end
end
get '/trouble' do
 erb :trouble, :layout => false
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
get "/export/mindmup/:mapid" do
  content_type 'application/octet-stream'
  contents=settings.s3_bucket.objects[map_key(params[:mapid])].read
  json=JSON.parse(contents)
  attachment (Rack::Utils.escape(json['title'])+'.mup')
  contents
end
get "/export/freemind/:mapid" do
  content_type 'application/octet-stream'
  contents=settings.s3_bucket.objects[map_key(params[:mapid])].read
  json=JSON.parse(contents)
  attachment (Rack::Utils.escape(json['title'])+'.mm')
  FreemindFormat.new(json).to_freemind
end
get "/map/:mapid" do
  @mapid = params[:mapid]
  session['mapid']=@mapid
  erb :editor
end

get "/publishingConfig" do
  @s3_upload_identifier = settings.current_map_data_version +  settings.key_id_generator.generate(:compact)
  @s3_key=settings.s3_upload_folder+"/" + @s3_upload_identifier + ".json"
  @s3_result_url= settings.base_url + "s3/" + @s3_upload_identifier
  @s3_content_type="text/plain"
  signer=S3PolicySigner.new
  @policy=signer.signed_policy settings.s3_secret_key, settings.s3_key_id, settings.s3_bucket_name,
                               @s3_key, @s3_result_url, settings.s3_max_upload_size*1024, @s3_content_type, settings.s3_form_expiry
  erb :s3UploadConfig, :layout => false
end

get '/trouble' do
  erb :trouble, :layout => false
end

helpers do
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
    return script_url_array if development?
    target_file="#{settings.public_folder}/#{settings.cache_prevention_key}.js" 
    if (!File.exists? target_file) then
      File.open(target_file,"w") do |output_file|
        script_url_array.each do |input_file|
          content= File.readlines("#{settings.public_folder}/#{input_file}")
          output_file.puts content
        end
      end
    end
    return ["/#{settings.cache_prevention_key}.js"] 
  end
  def load_scripts script_url_array
    script_tags=script_url_array.map do |url|
      url=url+ ((url.include? '?') ? '&':'?')+ '_version='+settings.cache_prevention_key unless url.start_with? '//'
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

