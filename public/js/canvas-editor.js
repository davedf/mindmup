$(function(){
  
  var initCanvas=function(idea){
    var stage = new Kinetic.Stage({
      container: 'container',
        width: 2048,
        height: 2048,
        draggable: false
    }),
    layer = new Kinetic.Layer(),
    dimensionProvider = function (title) {
      var text = new Kinetic.Idea({
        text: title
      });
      return {
        width: text.getWidth(),
        height: text.getHeight()
      };
    },
    mapModel = new MAPJS.MapModel(function layoutCalculator(idea) {
      return MAPJS.calculateLayout(idea, dimensionProvider);
    }),
    mediator = new MAPJS.KineticMediator(mapModel, layer);
    stage.add(layer);
    mapModel.setIdea(idea);
  }
  var attachTooltips=function(){
    _.each($('[rel=tooltip]'),function(item){ $(item).tooltip({title:$(item).attr('title')})});
  }
  var attach_menu_listeners=function(active_content,selectedId){
    var changed=false;
    var publishMap = function(result) {
      var publishTime=Date.now();
      logMapActivity('Publish',result.key);
      $("#s3form [name='file']").val(JSON.stringify(active_content));
      for (var name in result) {$('#s3form [name='+name+']').val(result[name])};
      $('#s3form').submit();
    }
    active_content.addEventSink(function() {
      if (!changed) {
        $("#toolbarShare").hide();
        $("#toolbarSave").show();
        logMapActivity('Edit');
        changed = true;
      }
      logUserActivity(_.toArray(arguments));
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
    $("#menuPublish").click(function(){
      $.getJSON("/publishingConfig", publishMap);
    });
  }
  function updateTitle(newTitle){
    document.title=newTitle;
    $('.st_btn').attr('st_title',newTitle);
    $('.brand').text(newTitle);
  }
  var load_content = function (jsonDocument) {
    var idea = content(jsonDocument);
    initCanvas(idea);
    attach_menu_listeners(idea,function(){/* somehow get selected id*/ return idea.id});
    logMapActivity('View');
    updateTitle(idea.title);
  };
  $.getJSON($("#container").attr("map-url"),load_content);
  attachTooltips();
});
