$(function(){
  var mapModel; 
  var changed=false;
  var saving=false;
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
        width: text.getWidth(), height: text.getHeight()
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
    var publishMap = function(result) {
      var publishTime=Date.now();
      logMapActivity('Publish',result.key);
      $("#s3form [name='file']").val(JSON.stringify(active_content));
      for (var name in result) {$('#s3form [name='+name+']').val(result[name])};
      $('#s3form').submit();
    }
    var saveTimeoutOccurred = function() {
      saving=false;
      $('#menuPublish').text('Save').addClass('btn-primary').attr("disabled", false);
      $('#toolbarSave p').show();
      showAlert('Unfortunately, there was a problem saving the map.','Please try again later. We have sent an error report and we will look into this as soon as possible','error');
      sendErrorReport('Map save failed');
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
      saving = true;
      $(this).text('Saving...').removeClass('btn-primary').attr("disabled", true);
      $('#toolbarSave p').hide();
      setTimeout(saveTimeoutOccurred,5000);
      logUserActivity('Fetching publishing config');
      $.getJSON("/publishingConfig", publishMap);
    });
  }
  function updateTitle(newTitle){
    document.title=newTitle;
    $('.st_btn').attr('st_title',newTitle);
    $('.brand').text(newTitle);
  }
  var map_url=$('#container').attr('mindmap');
  var mapId=$('#container').attr('mapid');

  var load_content = function (jsonDocument) {
    var idea = content(jsonDocument);
    initCanvas(idea);
    attach_menu_listeners(idea);
    logMapActivity('View',mapId);
    updateTitle(idea.title);
  };
  var loadAlertDiv=showAlert('Please wait, loading the map...');
  logUserActivity("loading map [" + map_url +"]");
  var jsonLoadSuccess= function(result,status){
    loadAlertDiv.detach();
    logUserActivity("loaded JSON map document");
    load_content(result);
  };
  var jsonFail= function(xhr,textStatus,errorMsg){
    var msg="Error loading map document ["+map_url+"] status=" + textStatus + " error msg= " + errorMsg;
    logUserActivity(msg);
    loadAlertDiv.detach();
    showAlert('Unfortunately, there was a problem loading the map.','An automated error report was sent and we will look into this as soon as possible','error');
    sendErrorReport(msg);
  };
  var jsonTryProxy=function(map_url){
    logMapActivity('ProxyLoad',mapId);
    $.ajax('/s3proxy/'+mapId,{ dataType: 'json', success:jsonLoadSuccess, error: jsonFail });
  };
  $.ajax(map_url,{ dataType: 'json', success:jsonLoadSuccess, error: jsonTryProxy });
  attachTooltips();
  $(window).bind('beforeunload', function() {
    if (changed && !saving) {
      return 'There are unsaved changes.';
  }});
});
