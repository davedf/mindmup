require File.join(File.dirname(__FILE__),'spec_helper.rb')

describe 'Analytics and logging' do
  # it "excludes google analytics from development and testing" do
  #   [:development,:test].each do |env|
  #     set :environment, env
  #     get "/"
  #     doc=Nokogiri::HTML(last_response.body)
  #     doc.css('#analytics')[0].text.should_not include "_gaq.push"
  #   end
  # end
  # it "includes google analytics for production" do
  #   set :environment, :production
  #   get "/"
  #   doc=Nokogiri::HTML(last_response.body)
  #   doc.css('#analytics')[0].text.should include "_gaq.push"
  # end
end
