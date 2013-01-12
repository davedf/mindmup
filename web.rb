require 'pp'
require 'sinatra'
require File.dirname(__FILE__)+'/lib/s3_policy_signer.rb'
require 'uuid'

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
  offline =  ENV['OFFLINE'] || "online"
  set :online, offline == "offline" ? false : true
end
get '/' do
  @mapId = settings.default_map
  erb :editor
end

get "/s3/:mapId" do
  redirect "/map/#{params[:mapId]}"
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
  def map_url mapId
    if settings.online?
      "http://%s/%s.json" %  [settings.s3_website, (mapId.include?("/") ?  mapId : settings.s3_upload_folder + "/" + mapId)]
    else
      "/default.json"
    end
  end
end

