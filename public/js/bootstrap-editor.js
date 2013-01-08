$(function(){
    var customClasses={ selectedClass:'btn-success', hoverClass:'btn-warning' }
    function jquery_repaint_map(active_content, active_jq_map,onComplete){
      var background_jq_map=$('#map1');
      dom_repaint_entire_map(active_content,background_jq_map);
      $('#map1 .MAP_label').addClass('btn');
      update_map(active_jq_map,visual_to_map(background_jq_map),onComplete);
      active_jq_map.find('.MAP_label').addClass('btn');
    }

    function load_content(json_object){
      var active_content=content(json_object);
      var selectedId=function(){
        return $('#map2').find('.'+customClasses.selectedClass).attr('idea') || active_content.id;
      }
      jquery_repaint_map(active_content,$('#map2'));
      attach_label_listeners($('#map2').find('.MAP_label'), $('#map2'),active_content, customClasses );
      attach_map_listeners(active_content,$('#map2'), jquery_repaint_map,customClasses);
      $('#menuAdd').click(function(){
        active_content.addSubIdea(selectedId(),'A cunning plan');  
      });
      $('#menuEdit').click(function(){
        var selected=selectedId();
        editLabel(
        $('#map2 .MAP_label[idea='+selected+']'),
        function(newValue){
          active_content.updateTitle(selected,newValue);
        }
        );
      });
      $('#menuDelete').click(function(){
        active_content.removeSubIdea(selectedId()); 
      });
      $('#menuClear').click(function(){
        _.each(active_content.ideas, function(idea){ active_content.removeSubIdea(idea.id);})
      });
 	var publishMap = function(result) {
		$("#s3form [name='file']").val(JSON.stringify(active_content));
        for (var name in result) {$('#s3form [name='+name+']').val(result[name])};
        $('#s3form').submit();
		console.log("result key ",result.key)	
	}
    $("#menuPublish").click(function(){
		$.getJSON("/publishingConfig", publishMap);
    });
  }
  $.getJSON($("#map2").attr("map-content"), function(result) {
    load_content(result);
  });
});
