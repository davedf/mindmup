require File.join(File.dirname(__FILE__),'spec_helper.rb')

describe 'Freemind formatter' do  
	it 'converts a single node map into a MAP/NODE XML element in freemind format' do
    idea={'id'=>1, 'title'=>'Root Node'};
    freemind_format(idea).should=='<map version="0.7.1"><node ID="1" TEXT="Root Node"></node></map>';
  end

	it 'converts double quotes, > and < to XML entity in node titles' do
    idea={'id'=>1, 'title'=>'Text"<>"<>More'};
    freemind_format(idea).should=='<map version="0.7.1"><node ID="1" TEXT="Text&quot;&lt;&gt;&quot;&lt;&gt;More"></node></map>';
  end
	it 'embeds subideas into child nodes' do
    idea={'id'=>1, 'title'=>'A', 'ideas'=>{'-1'=>{'id'=>2, 'title'=>'B'},'2'=>{'id'=>3, 'title'=>'C'}}};
    freemind_format(idea).should=='<map version="0.7.1"><node ID="1" TEXT="A">'+
    '<node ID="2" TEXT="B"></node>'+
    '<node ID="3" TEXT="C"></node>'+
    '</node></map>';
  end
end
