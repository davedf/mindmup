$(function(){
    var changed=false;
    
    function jquery_repaint_map(active_content, active_jq_map,onComplete){
      var background_jq_map=$('#map1');
      dom_repaint_entire_map(active_content,background_jq_map);
      $('#map1 .MAP_label').addClass('btn');
      update_map(active_jq_map,visual_to_map(background_jq_map),onComplete);
      active_jq_map.find('.MAP_label').addClass('btn');
    }

    function load_content(json_object){
     logMapActivity('View');
      var active_content=content(json_object);
      $("#menuPublish").hide();
      ;
      
      var attachPopoverClick = function(currentLabel) {
			currentLabel.click(function(){
				$("#map2 .MAP_label").popover('destroy');
				var placementVal = $(window).height()/2 > currentLabel.offset().top ? 'bottom' : 'top';
	            currentLabel.popover({placement:placementVal,html:true,trigger:'manual',title:'Options',
	                        content:'<ul class="nav nav-tabs nav-stacked">' +
	                                '<li><a href="#" class="menuAdd">Add</a></li>' +
	                                '<li><a href="#" class="menuEdit">Edit</a></li>' + 
	                                '<li><a href="#" class="menuRemove">Remove</a></li>' +
	                                '</ul>'});
	            currentLabel.popover('show');
	            $('.menuAdd').click(function(){currentLabel.popover('hide');active_content.addSubIdea(currentLabel.attr("idea"),'A cunning plan');  });
	            $('.menuRemove').click(function(){currentLabel.popover('hide');active_content.removeSubIdea(currentLabel.attr("idea"));});
	            $('.menuEdit').click(function(){currentLabel.popover('hide');
	                editLabel(
	                    currentLabel,
	                        function(newValue){
	                            active_content.updateTitle(currentLabel.attr("idea"),newValue);
	                        }
	                );
	            });
				
			});

        }
      var customClasses={ selectedClass:'btn-success', hoverClass:'btn-warning',newLabelCallBack:attachPopoverClick }
    
      var selectedId=function(){
        return $('#map2').find('.'+customClasses.selectedClass).attr('idea') || active_content.id;
      }
      jquery_repaint_map(active_content,$('#map2'));
      attach_label_listeners($('#map2').find('.MAP_label'), $('#map2'),active_content, customClasses );
      attach_map_listeners(active_content,$('#map2'), jquery_repaint_map,customClasses);
      active_content.addEventListener("changed",function() {
        if (!changed) {
          $("#menuPublish").show();
        logMapActivity('Edit');
        }
        changed = true;
      });
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
      $("#map2 .MAP_label").each(function() {attachPopoverClick($(this));});

    var publishMap = function(result) {
        var publishTime=Date.now();
        logMapActivity('Publish',result.key);
    
        $("#s3form [name='file']").val("window.map="+JSON.stringify(active_content));
        for (var name in result) {$('#s3form [name='+name+']').val(result[name])};
        $('#s3form').submit();
    }
    $("#menuPublish").click(function(){
        $.getJSON("/publishingConfig", publishMap);
    });
  }
  load_content(window.map);
});
