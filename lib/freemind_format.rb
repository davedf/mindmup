class FreemindFormat
  def initialize idea=''
    @idea=idea
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
