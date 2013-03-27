require File.join(File.dirname(__FILE__),'spec_helper.rb')

describe FreemindFormat do  

  
  complex_xml= '<map version="0.7.1"><node ID="1" TEXT="A">'+
    '<node ID="2" TEXT="B"></node>'+
    '<node ID="3" TEXT="C"></node>'+
    '</node></map>'
  complex_xml_with_other_stuff= '<map version="0.7.1">
     <node ID="1" TEXT="A"><!-- comment -->'+
    '<node ID="2" TEXT="B"><ignore/></node>'+
    '<node ID="3" TEXT="C"></node>'+
    '</node></map>'
  
  complex_json = {'id'=>'1', 'title'=>'A', 'ideas'=>{ 1 =>{'id'=>'2', 'title'=>'B'}, 2 =>{'id'=>'3', 'title'=>'C'}}}
  
  def freemind_format (idea) 
    FreemindFormat.new(idea).to_freemind
  end
  
  def json_format (xml) 
    FreemindFormat.new().from_freemind(xml)
  end
  
  it 'converts a single node map into a MAP/NODE XML element in freemind format' do
    idea={'id'=>1, 'title'=>'Root Node'};
    freemind_format(idea).should=='<map version="0.7.1"><node ID="1" TEXT="Root Node"></node></map>';
  end
  it 'converts double quotes, > and < to XML entity in node titles' do
    idea={'id'=>1, 'title'=>'Text"<>"<>More'};
    freemind_format(idea).should=='<map version="0.7.1"><node ID="1" TEXT="Text&quot;&lt;&gt;&quot;&lt;&gt;More"></node></map>';
  end
  it 'embeds subideas into child nodes' do
    idea=complex_json
    freemind_format(idea).should== complex_xml
  end
  it 'converts single freemind xml into mindmup json' do
    json_format('<map version="0.7.1"><node ID="1" TEXT="A"></node></map>').should  == {'id' => "1", 'title' => "A"} 
  end
  it 'converts complex freemind xml into mindmup json' do
    json_format(complex_xml).should  == complex_json 
  end
  it 'ignores any non-node tags in XML' do
    json_format(complex_xml_with_other_stuff).should  == complex_json 
  end
  it 'converts xml entities into string equivalents while parsing xml' do
    json_format('<map version="0.7.1"><node ID="1" TEXT="Text&quot;&lt;&gt;&quot;&lt;&gt;More"></node></map>').should=={'id'=>'1', 'title'=>'Text"<>"<>More'};
  end
end
