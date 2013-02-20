require 'nokogiri'
class FreemindFormat
  def initialize idea=''
    @idea=idea
  end
  def xml_to_json (node)

    result = {"id" => node.attr("ID"), "title" => node.attr("TEXT") }
    children= node.children().map {|child| xml_to_json child}
    if (children.length>0) 
      child_obj={}
      index=1;
      children.each {|child| child_obj[index] = child; index+=1; }
      result["ideas"]=child_obj
    end
    result
  end
  def from_freemind (xml)
    root=Nokogiri::XML(xml).xpath('//map').children[0]
    xml_to_json root
  end
  def children (idea_node)
    idea_node['ideas'] || {}
  end
  def freemind_format_node(idea_node)
    %Q{<node ID="#{idea_node['id']}" TEXT="#{Rack::Utils.escape_html(idea_node['title'])}">#{
      children(idea_node).sort_by {|k,v|k.to_f}.map {|k,v| freemind_format_node(v)}.join 
    }</node>}
  end
  def to_freemind
    %Q{<map version="0.7.1">#{freemind_format_node(@idea)}</map>}
  end
end
