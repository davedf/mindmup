require 'pp'
require 'sinatra'
require File.dirname(__FILE__)+'/lib/s3_policy_signer.rb'
require 'uuid'
require 'aws-sdk'

configure do
  set :s3_website,ENV['S3_WEBSITE']
  set :base_url, ENV['SITE_URL'] || "/"
  set :s3_key_id, ENV['S3_KEY_ID']
  set :s3_form_expiry, (60*60*24*30)
  set :s3_bucket_name, ENV['S3_BUCKET_NAME'] 
  set :s3_secret_key, ENV['S3_SECRET_KEY']
  set :s3_upload_folder, ENV['S3_UPLOAD_FOLDER']		
  set :default_map, ENV['DEFAULT_MAP']|| "map/default"
  set :s3_max_upload_size, 100
  set :key_id_generator, UUID.new
  set :current_map_data_version, ENV['CURRENT_MAP_DATA_VERSION'] || "a1"
  set :network_timeout_millis, ENV['NETWORK_TIMEOUT_MILLIS']||10000
  offline =  ENV['OFFLINE'] || "online"
  set :online, offline == "offline" ? false : true
  AWS.config(:access_key_id=>settings.s3_key_id, :secret_access_key=>settings.s3_secret_key)
  s3=AWS::S3.new()
  set :s3_bucket, s3.buckets[settings.s3_bucket_name]
end
get '/' do
  @mapId = settings.default_map
  erb :editor
end

get "/s3/:mapId" do
  redirect "/map/#{params[:mapId]}"
end

get "/s3proxy/:mapId" do
  response.headers['Content-Type']='application/json'
  settings.s3_bucket.objects[map_key(params[:mapId])].read
end
get "/map/:mapId" do
  @mapId = params[:mapId]
  erb :editor
end

get "/publishingConfig" do
  s3_upload_identifier = settings.current_map_data_version +  settings.key_id_generator.generate(:compact)
  s3_key=settings.s3_upload_folder+"/" + s3_upload_identifier + ".json"
  s3_result_url= settings.base_url + "s3/" + s3_upload_identifier
  s3_content_type="text/plain"
  signer=S3PolicySigner.new
  policy=signer.signed_policy settings.s3_secret_key, settings.s3_key_id, settings.s3_bucket_name, s3_key, s3_result_url, settings.s3_max_upload_size*1024, s3_content_type, settings.s3_form_expiry

  erb :s3UploadConfig, :layout => false,locals:{s3_upload_identifier:s3_upload_identifier,s3_key:s3_key,s3_result_url:s3_result_url,signer:signer,policy:policy,s3_content_type:s3_content_type}
end

helpers do  
  def welcome_alert

    if session['welcome'].nil? 
      session['welcome'] = 'true';
      %q{<div class='alert'><button type='button' class='close' data-dismiss='alert'>&times;</button>
      <p><strong>Welcome to MindMup</strong>
      We are still in Beta and the site doesn't work on mobile devices yet. Any 
         <a href='#' class='menuFeedback' data-target='#modalFeedback' data-toggle='modal'>feedback</a>
         is greatly appreciated, especially if you spot any problems.</p></div>}
    end

  end
  def map_key mapId
    (mapId.include?("/") ?  "" : settings.s3_upload_folder + "/") + mapId + ".json"
  end
  def map_url mapId
    if settings.online?
      "http://%s/%s" %  [settings.s3_website, map_key(mapId)]
    else
      "/default.json"
    end
  end
end

