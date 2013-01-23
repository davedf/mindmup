require 'rack/utils'

def freemind_format_node(idea_node)
    return %Q{<node ID="#{idea_node['id']}" TEXT="#{Rack::Utils.escape_html(idea_node['title'])}">#{
      (idea_node['ideas'].nil? || idea_node['ideas']=={})?"": idea_node['ideas'].sort_by {|k,v|k.to_f}.map {|k,v| freemind_format_node(v)}.join
    }</node>}
end

def freemind_format(idea)
  return %Q{<map version="0.7.1">#{freemind_format_node(idea)}</map>}
end
