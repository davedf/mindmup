require File.join(File.dirname(__FILE__),'spec_helper.rb')

describe 'Welcome message banner' do  
  before(:each) do
    header "User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.152 Safari/537.22"
  end
  it "shows the first welcome message about beta on an empty session" do
    local_session={}
    get "/",{}, {'rack.session'=>local_session}
    welcome_div=Nokogiri::HTML(last_response.body).css('#welcome_message')[0]
    welcome_div.text.should include 'We are still in Beta'
    local_session['welcome'].should == 1
  end
  it "shows the second welcome message about keyboard shortcuts if Beta was already shown" do
    ['1',1,'true',true].each do |prev_msg| # check for true for legacy, first version just had true instead of numbers
      local_session={'welcome' => prev_msg}
      get "/",{}, {'rack.session'=>local_session}
      welcome_div=Nokogiri::HTML(last_response.body).css('#welcome_message')[0]
      welcome_div.text.should include 'keyboard shortcuts'
      local_session['welcome'].should == 2 
    end
  end
end
