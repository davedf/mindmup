require File.join(File.dirname(__FILE__),'spec_helper.rb')

describe 'Configuration' do
  before(:each) do
    header "User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.152 Safari/537.22"
  end
  def last_response_config
    n=Nokogiri::HTML last_response.body
    eval(n.xpath('//script[@id="main"]').text().match('MM.main\(([^)]*)\)')[1])
  end
  it "appends network timeout millis setting as newtworkTimeoutMillis" do
    set :network_timeout_millis, 999
    get "/"
    last_response_config[:networkTimeoutMillis].should==999
  end
  it "appends google analytics account as googleAnalyticsAccount" do
    set :google_analytics_account, 'abcd'
    get "/"
    last_response_config[:googleAnalyticsAccount].should=='abcd'
  end
end
