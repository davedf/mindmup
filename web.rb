require 'pp'
require 'sinatra'
require 'uuid'
require 'aws-sdk'

require File.dirname(__FILE__)+'/lib/s3_policy_signer.rb'
require File.dirname(__FILE__)+'/lib/freemind_format.rb'

configure do
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
  set :current_file_version, settings.key_id_generator.generate(:compact) 
end
get '/' do
  if session['mapid'].nil? 
    @mapId=settings.default_map
    erb :editor
  else
    redirect "/map/#{session['mapid']}"
  end
end

get "/s3/:mapId" do
  redirect "/map/#{params[:mapId]}"
end

get "/s3proxy/:mapId" do
  content_type 'application/json'
  settings.s3_bucket.objects[map_key(params[:mapId])].read
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
get "/map/:mapId" do
  @mapId = params[:mapId]
  session['mapid']=@mapId
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
  def map_key mapId
    (mapId.include?("/") ?  "" : settings.s3_upload_folder + "/") + mapId + ".json"
  end
  def map_url mapId
    if settings.online?
      "http://%s/%s" %  [settings.s3_website, map_key(mapId)]
    else
      "/offline/default.json"
    end
  end
end

