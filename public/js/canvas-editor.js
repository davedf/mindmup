$(function(){
  var mapModel; 
  var canvasSize= { width:  $('#container').width(), height: $('#container').height()};
  logUserActivity('Creating canvas Size ' + JSON.stringify(canvasSize));
  
  var initCanvas=function(idea){
    var stage = new Kinetic.Stage($.extend({},canvasSize,{
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
var map_url=$('#container').attr('mindmap');
var loadAlert=showAlert('Please wait, loading the map...');
logUserActivity("loading map [" + map_url +"]");
$.ajax(map_url,{
    dataType: 'json',
    success: function(result,status){
        loadAlert.detach();
        logUserActivity("loaded JSON map document");
        load_content(result);
    },
    error: function(xhr,textStatus,errorMsg){
      var msg="Error loading map document ["+map_url+"] status=" + textStatus + " error msg= " + errorMsg;
      logUserActivity(msg);
      loadAlert.detach();
      showAlert('Unfortunately, there was a problem loading the map.','An automated error report was sent and we will look into this as soon as possible','error');
      sendErrorReport(msg);
    }
});
attachTooltips();
});
