$(function(){
  var mapModel; 
  //var canvasSize= { width:  $('#container').width(), height: $('#container').height()};
  var canvasSize= { width:  100, height: 100};

  showAlert("creating canvas of ",JSON.stringify(canvasSize)) ;
  
  var initCanvas=function(idea){
    var stage = new Kinetic.Stage($.extend(canvasSize,{
      container: 'container',
      draggable:true
    })),
    dimensionProvider = function (title) {
      var text = new Kinetic.Idea({
        text: title
      });
      return {
        width: text.getWidth(),
        height: text.getHeight()
      };
    };
    stage.attrs.x = 0.5 * stage.getWidth();
	  stage.attrs.y = 0.5 * stage.getHeight();

mapModel = new MAPJS.MapModel(function layoutCalculator(idea) {
  return MAPJS.calculateLayout(idea, dimensionProvider);
});
var mediator = new MAPJS.KineticMediator(mapModel, stage);
mapModel.setIdea(idea);
}
var attachTooltips=function(){
  _.each($('[rel=tooltip]'),function(item){ $(item).tooltip({placement:'bottom',title:$(item).attr('title')})});
}
var attach_menu_listeners=function(active_content){
  var changed=false;
  var publishMap = function(result) {
    var publishTime=Date.now();
    logMapActivity('Publish',result.key);
    $("#s3form [name='file']").val("window.map=" + JSON.stringify(active_content));
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
  $('#menuAdd').click(mapModel.addSubIdea.bind(mapModel, 'double click to edit'));
  $('#menuEdit').click(mapModel.editNode);
  $('#menuDelete').click(mapModel.removeSubIdea);
  $('#menuClear').click(mapModel.clear);
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
  attach_menu_listeners(idea);
  logMapActivity('View');
  updateTitle(idea.title);
};
load_content(window.map);
attachTooltips();
});
