require File.join(File.dirname(__FILE__),'spec_helper.rb')

describe 'Configuration' do
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
