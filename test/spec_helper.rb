require 'rack/test'
require 'sinatra'
require 'nokogiri'

set :environment, :test
require File.dirname(__FILE__)+'/../web.rb'

# test setting overrides
set :s3_website,'testS3Url'
set :s3_bucket_name, 'testbucket' 
set :s3_upload_folder, 'testfolder' 
set :default_map, 'defaultmap' 

def app
  Sinatra::Application
end

RSpec.configure do |config|
  config.include Rack::Test::Methods
end
