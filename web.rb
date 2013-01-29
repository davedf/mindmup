require 'pp'
require 'sinatra'
require 'uuid'
require 'aws-sdk'
require 'sinatra/assetpack'

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
end
get '/' do
  if session['mapid'].nil?
    @mapid=settings.default_map
    erb :editor
  else
    redirect "/map/#{session['mapid']}"
  end
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
  freemind_format(json)
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

  def load_scripts script_url_array 
    script_tags=script_url_array.map do |url|
      url=url+ ((url.include? '?') ? '&':'?')+ '_version='+settings.cache_prevention_key
      %Q{ <script>_currentScript='#{url}'</script><script src='#{url}' onload='_loadedScripts.push(this.src)' onerror='_errorScripts.push(this.src)'></script>}
    end
   %Q^<script>
      _loadedScripts=[]
      _errorScripts=[]
      _jsErrorsWhileLoading=[]
      _currentScript=null
      window.onerror=function(message,url,line){
        _jsErrorsWhileLoading.push({'message':message, 'url':url, 'line':line});
      }
    </script>
    #{script_tags.join('\n')}
    <script>
      window.onerror=function(){};
      if (_errorScripts.length>0 || _jsErrorsWhileLoading.length>0 || _loadedScripts.length!=#{script_url_array.length}){
        var d=document.createElement("div");
        var c=document.createElement('div');
        d.appendChild(document.createTextNode("Unfortunately, there was an error while loading the JavaScript files required by this page."+
          " This might be due to a temporary network error or a firewall blocking access to required scripts. "+ 
          " Please try again later. " + 
          " If the problem persists, we'd appreciate if you could contact us at contact@mindmup.com"));
        d.style.position='absolute'; d.style.top='30%'; d.style.left='40%'; d.style.width='20%'; d.style.backgroundColor='#773333'; d.style.color='white'; d.style.fontWeight='bold'; d.style.padding='20px'; d.style.border='3px solid black';
        c.style.position='absolute'; c.style.top=0; c.style.left=0; c.style.width='100%'; c.style.height='100%'; c.style.minHeight='100%'; c.style.backgroundColor='#999999'; 
        c.appendChild(d);
        document.getElementsByTagName("body")[0].appendChild(c);
      }
     </script>
     ^
  end
end

assets do
  serve '/public', from: 'public'
  serve '/offline', from: 'offline'
  js :app, [
    '/public/mapjs-compiled.js',
    '/public/mm.js',
    '/public/activity-log.js',
    '/public/alert.js',
    '/public/map-repository.js',
    '/public/feedback.js',
    '/public/vote.js',
    '/public/welcome-message.js',
    '/public/map-widget.js',
    '/public/floating-toolbar.js',
    '/public/main.js'
  ]
  js :offline, [
    '/offline/jquery.min.js',
    '/offline/underscore-min.js',
    '/offline/bootstrap.min.js',
    '/offline/jquery-ui-1.10.0.custom.min.js',
    '/offline/kinetic-v4.2.0-custom-min.js'
  ]
  css :app, [
    '/public/mindmap.css'
  ]
end
