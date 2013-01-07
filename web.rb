require 'pp'
require 'sinatra'
require File.dirname(__FILE__)+'/lib/s3_policy_signer.rb'

configure do
    set :base_url, ENV['SITE_URL'] || "/"
		set :s3_key_id, ENV['S3_KEY_ID']
		set :s3_form_expiry, (60*60*24*30)
		set :s3_bucket_name, ENV['S3_BUCKET_NAME'] 
		set :s3_secret_key, ENV['S3_SECRET_KEY']
		set :s3_upload_folder, ENV['S3_UPLOAD_FOLDER']		
		set :s3_max_upload_size, 100
end
get '/' do
  "Hello world! And again..."
end

get '/GetTinyUrl' do
  "asksjkks"
end


post "/s3upload" do 
  "you sent "+params[:text]
end

get "/s3upload" do
  erb :test 
end

get "/publishingConfig" do
  s3_upload_identifier = SecureRandom.uuid;
  s3_key=settings.s3_upload_folder+"/" + s3_upload_identifier + ".txt"
  s3_result_url= params[:pageName] + "?id=" + s3_upload_identifier
  s3_content_type="text/plain"
	signer=S3PolicySigner.new
	policy=signer.signed_policy settings.s3_secret_key, settings.s3_key_id, settings.s3_bucket_name, s3_key, s3_result_url, settings.s3_max_upload_size*1024, s3_content_type, settings.s3_form_expiry
	erb :s3UploadConfig,locals:{s3_upload_identifier:s3_upload_identifier,s3_key:s3_key,s3_result_url:s3_result_url,signer:signer,policy:policy,s3_content_type:s3_content_type}
end

helpers do   
  def s3_javascript_config
		 valid_upload_extensions= ['txt']
		 upload_path=settings.s3_upload_folder+"/"
		 s3_result_url=settings.base_url
		 signer=S3PolicySigner.new
		 %Q!
	   <script type="text/javascript">
       s3_params={
         'key' : '#{upload_path}',
         'AWSAccessKeyId' :'#{settings.s3_key_id}', 
         'success_action_redirect' :'#{s3_result_url}',
       };
       s3_policies={
         #{ valid_upload_extensions.inject("") do |result,ext| 
					 policy=signer.signed_policy settings.s3_secret_key, settings.s3_key_id, settings.s3_bucket_name, upload_path, s3_result_url, settings.s3_max_upload_size*1024, "image/#{ext}", settings.s3_form_expiry
           result+ " #{ext}:{ 'policy' : '#{policy[:policy]}', 'signature' : '#{policy[:signature]}' },"
           end 
          }
       };
			 s3_upload_extensions=#{valid_upload_extensions};
			 s3_url="https://#{settings.s3_bucket_name}.s3.amazonaws.com/";
	   </script>!
	end
end

