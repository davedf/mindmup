require File.join(File.dirname(__FILE__),'spec_helper.rb')

describe 'Cache prevention' do  
  it "settings.current_file_version is appended to all local javascript resources" do
    set :current_file_version, 'XYZ' 
    get "/"
    doc=Nokogiri::HTML(last_response.body)
    local_scripts=doc.xpath('//script').map {|t| t.attr('src')}.reject {|st| st.nil? || st.start_with?('//') || st.start_with?('http://')};
    (local_scripts.reject {|st| st.end_with? "?version=XYZ"}).should==[]
  end
  it "settings.current_file_version is appended to all local css resources" do
    set :current_file_version, 'XYZ' 
    get "/"
    doc=Nokogiri::HTML(last_response.body)
    local_scripts=doc.xpath('//link[@rel="stylesheet"]').map {|t| t.attr('href')}.reject {|st| st.nil? || st.start_with?('//') || st.start_with?('http://')};
    (local_scripts.reject {|st| st.end_with? "?version=XYZ"}).should==[]
  end
end
