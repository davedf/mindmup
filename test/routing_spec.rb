require File.join(File.dirname(__FILE__),'spec_helper.rb')

describe 'Map request routing' do
  def last_response_config
    n=Nokogiri::HTML last_response.body
    eval(n.xpath('//script[@id="main"]').text().match('MM.main\(([^)]*)\)')[1])
  end
  before(:each) do
    header "User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.152 Safari/537.22"
  end
  describe 'named map route' do
    it "takes map ID from the url after /map, appends .json and prepends S3 website and folder to the mindmap attribute. sets mapid attrib to just the map id." do
      get "/map/ABCDEFGH"
      last_response.should be_ok
      last_response.should_not be_redirect
      last_response_config[:mapUrl].should=='http://testS3Url/testfolder/ABCDEFGH.json'
      last_response_config[:mapId].should=='ABCDEFGH'
    end
    it "puts the id of the map into session mapid so that users can easily go back to it" do
      session={}
      get "/map/ABCDEFGH",{},{'rack.session'=>session}
      session["mapid"].should=='ABCDEFGH'
    end
    it "ignores any previous session mapids" do
      get "/map/ABCDEFGH",{}, {'rack.session'=>{'mapid'=>'PreviousMap'}}
      last_response.should be_ok
      last_response.should_not be_redirect
      last_response_config[:mapUrl].should=='http://testS3Url/testfolder/ABCDEFGH.json'
      last_response_config[:mapId].should=='ABCDEFGH'
    end
  end
  describe 'homepage route' do
    it "uses the default map on the homepage, if the user had no previous map stored" do
      get "/"
      last_response.should be_ok
      last_response.should_not be_redirect
      last_response_config[:mapId].should=='defaultmap'
    end
    it "uses the last viewed map as the homepage, if the user had a previous map" do
      get "/",{}, {'rack.session'=>{'mapid'=>'PreviousMap'}}
      last_response.should be_redirect
      follow_redirect!
      last_request.url.should=='http://example.org/map/PreviousMap'
    end
  end
  describe "/default route" do
    it "uses the default map, if the user had no previous map stored" do
      get "/default"
      last_response.should be_ok
      last_response_config[:mapId].should=='defaultmap'
    end
    it "uses the default map, even if the user had a previous map" do
      get "/default",{}, {'rack.session'=>{'mapid'=>'PreviousMap'}}
      last_response.should be_ok
      last_response_config[:mapId].should=='defaultmap'
    end
    it "does not touch the session mapid" do
      session={"mapid"=>"PreviousMap"}
      get "/default",{},{'rack.session'=>session}
      session["mapid"].should=='PreviousMap'
    end
  end
  describe "/gd" do
    it "parses JSON to retrieve google IDs and redirects to g1+ID" do
      get '/gd?state=%7B%22ids%22%3A%5B%220B79-DtmfqRMET0x2NHpoLWd5ZWM%22%5D%2C%22action%22%3A%22open%22%2C%22userId%22%3A%22110457656708424572832%22%7D'
      last_response.should be_redirect
      follow_redirect!
      last_request.url.should=='http://example.org/map/g10B79-DtmfqRMET0x2NHpoLWd5ZWM'
    end
  end
  describe 'browser whitelisting' do
    before(:each) do
      header "User-Agent", "Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))"
    end      
    def last_response_body_xml
      Nokogiri::HTML last_response.body
    end
    it "does not load map config with /map/xxx if the browser is not in the white list" do
      get "/map/ABCD"
      last_response_body_xml.xpath('//script[@id="main"]').should be_empty
    end
    it "does not load map config with / if the browser is not in the white list" do
      header "User-Agent", "Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))"
      get "/"
      last_response_body_xml.xpath('//script[@id="main"]').should be_empty
    end
    it "loads map config if browser is not in white list but users accept the risk" do
      header "User-Agent", "Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))"
      get "/", {}, {'rack.session'=>{'browserok' => true}}
      last_response_body_xml.xpath('//script[@id="main"]').should_not be_empty
    end
    it "enables users to self-approve a browser using /browserok" do
      header "User-Agent", "Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))"
      session = {}
      get "/browserok/ABC",{}, {'rack.session'=>session}
      session["browserok"].should be_true
      last_response.should be_redirect
      follow_redirect! 
      last_request.url.should == "http://example.org/map/ABC"
    end
  end 
end
