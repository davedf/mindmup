require File.join(File.dirname(__FILE__),'spec_helper.rb')

describe 'Map request routing' do
  describe 'named map route' do
    it "takes map ID from the url after /map, appends .json and prepends S3 website and folder to the mindmap attribute. sets mapid attrib to just the map id." do
      get "/map/ABCDEFGH"
      last_response.should be_ok
      last_response.should_not be_redirect
      container_div=Nokogiri::HTML(last_response.body).css('#container')[0]
      container_div['mindmap'].should=='http://testS3Url/testfolder/ABCDEFGH.json'
      container_div['mapid'].should=='ABCDEFGH'
    end
    it "puts the id of the map into session mapid so that users can easily go back to it" do
      session={}
      get "/map/ABCDEFGH",{},{'rack.session'=>session}
      session['mapid'].should=='ABCDEFGH'
    end
    it "ignores any previous session mapids" do
      get "/map/ABCDEFGH",{}, {'rack.session'=>{'mapid'=>'PreviousMap'}}
      last_response.should be_ok
      last_response.should_not be_redirect
      container_div=Nokogiri::HTML(last_response.body).css('#container')[0]
      container_div['mindmap'].should=='http://testS3Url/testfolder/ABCDEFGH.json'
      container_div['mapid'].should=='ABCDEFGH'
    end
  end
  describe 'homepage route' do
    it "uses the default map on the homepage, if the user had no previous map stored" do
      get "/"
      last_response.should be_ok
      last_response.should_not be_redirect
      container_div=Nokogiri::HTML(last_response.body).css('#container')[0]
      container_div['mindmap'].should=='http://testS3Url/testfolder/defaultmap.json'
      container_div['mapid'].should=='defaultmap'
    end
    it "uses the last viewed map as the homepage, if the user had a previous map" do
      get "/",{}, {'rack.session'=>{'mapid'=>'PreviousMap'}}
      last_response.should be_ok
      last_response.should_not be_redirect
      container_div=Nokogiri::HTML(last_response.body).css('#container')[0]
      container_div['mindmap'].should=='http://testS3Url/testfolder/PreviousMap.json'
      container_div['mapid'].should=='PreviousMap'
    end
  end
  it "appends network timeout millis setting to the container div" do
    set :network_timeout_millis, 999
    get "/map/ABCDEFGH"
    container_div=Nokogiri::HTML(last_response.body).css('#container')[0]
    container_div['network_timeout_millis'].should=='999'
  end
end
