$(function(){
  var mapModel;
  var mediator;
  var changed=false;
  var saving=false;
  var container = jQuery('#container');
  var canvasSize= { width:  $('#container').width(), height: $('#container').height()};
  var wasRelevantOnLoad=false;

  logUserActivity('Creating canvas Size ' + JSON.stringify(canvasSize));

  /* documentation map doesn't have ID=1, so anything with ID=1 was created as a new map */
  var startedFromNew= function(contentAggregate){
    return contentAggregate.id==1;
  }
  var isNodeRelevant= function(ideaNode){
    return ideaNode.title && ideaNode.title.search(/MindMup|Lancelot|cunning|brilliant|Press Space|famous/)==-1;
  }
  var isNodeIrrelevant= function(ideaNode){
    return !isNodeRelevant(ideaNode);
  }
  var isMapRelevant = function(contentAggregate){
    return startedFromNew(contentAggregate) &&
      contentAggregate.find(isNodeRelevant).length>5 &&
      contentAggregate.find(isNodeIrrelevant).length<3;
  };
  var initCanvas=function(idea){
    var stage = new Kinetic.Stage({
      container: 'container',
        draggable:true
    });
    mapModel = new MAPJS.MapModel(
        function layoutCalculator(idea) {
          return MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider);
        }, [
        'A brilliant idea...',
        'A cunning plan...',
        'We\'ll be famous...',
        'Lancelot, Galahad, and I wait until nightfall, and then leap out of the rabbit, taking the French by surprise'
        ]
        );
    mediator = new MAPJS.KineticMediator(mapModel, stage);
    var	setStageDimensions = function () {
      stage.setWidth(container.width());
      stage.setHeight(container.height());
      stage.draw();
    };
    setStageDimensions();
    stage.attrs.x = 0.5 * stage.getWidth();
    var initialLayout=MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider);
    var minY=_.min(initialLayout.nodes, function(node){return node.y}).y;
    stage.attrs.y = Math.max(-1*minY+$('#topbar').outerHeight()+5,0.5 * stage.getHeight());
    mapModel.setIdea(idea);
    $(window).resize(setStageDimensions);
  }
  var attach_menu_listeners=function(active_content){
    var publishMap=function(){
      var publishing = true;
      var saveTimeoutOccurred = function() {
        publishing = false;
        $('#menuPublish').text('Save').addClass('btn-primary').attr("disabled", false);
        $('#toolbarSave p').show();
        showAlert('Unfortunately, there was a problem saving the map.','Please try again later. We have sent an error report and we will look into this as soon as possible','error');
        sendErrorReport('Map save failed');
      }
      var submitS3Form = function(result) {
        publishing=false;
        var relevant=isMapRelevant(active_content);
        if (relevant && !wasRelevantOnLoad)
          logMapActivity('Created Relevant',result.key);
        else if (wasRelevantOnLoad)
          logMapActivity('Saved Relevant',result.key);
        else
          logMapActivity('Saved Irrelevant',result.key);
        $("#s3form [name='file']").val(JSON.stringify(active_content));
        for (var name in result) {$('#s3form [name='+name+']').val(result[name])};
        saving = true;
        $('#s3form').submit();
      }
      var fetchPublishingConfig=function(){
        logUserActivity('Fetching publishing config');
        $.ajax("/publishingConfig",{dataType: 'json',cache:false,success:submitS3Form, error:function(result){
          if (publishing) setTimeout(fetchPublishingConfig,1000);
         }
        });
      }
      setTimeout(saveTimeoutOccurred,parseInt(container.attr('network_timeout_millis')));
      fetchPublishingConfig();
    };
    active_content.addEventSink(function() {
      saving=false;
      if (!changed) {
        $("#toolbarShare").hide();
        $("#toolbarSave").show();
        $('#menuPublish').effect('highlight');
        logMapActivity('Edit');
        changed = true;
      }
      logUserActivity(_.toArray(arguments));
    });
    mapModel.addEventListener('analytic', function (origin, action, source) {
      logActivity('Map Model',action,source);
    });
    $('#toolbarEdit').mapToolbarWidget(mapModel);
    $("#menuPublish").click(function(){
      $('#menuPublish').html('<i class="icon-spinner icon-spin"></i>Saving...').removeClass('btn-primary').attr("disabled", true);
      $('#toolbarSave p').hide();
      publishMap();
    });
    $('.mapExport').click(function () {
      var formats={'.mm':MAPJS.freemindFormat, '.mup':JSON.stringify};
      var dataFormat = $(this).data('format');
      var url = 'data:application/json;base64,' + $.base64.encode(formats[dataFormat](active_content));
      $(this).attr('href', url).attr('download',active_content.title + dataFormat);
      return true;
    });
    $("[rel=tooltip]").tooltip();
    $("#menuShortcuts").popover({
        placement: function(){
         return $('#menuShortcuts').offset().left < 250 ?'right':'left'
        },
        trigger:'click',html:'true',content:
        '<strong>Enter</strong>: Add sibling<br/>' +
        '<strong>Tab</strong>: Add child<br/>' +
        '<strong>Space</strong>: Edit node<br/>' +
        '<strong>Backspace</strong>: Remove node<br/>' +
        '<strong>Delete</strong>: Remove node<br/>' +
        '<strong>Arrow keys</strong>: Move selection<br/>'
       });
    $("#toolbarEdit button").click(function(){
         logActivity("Toolbar Click", $(this).attr('data-title'));
    });
  }
  function updateTitle(newTitle){
    document.title=newTitle;
    $('.st_btn').attr('st_title',newTitle);
    $('#map_title').text(newTitle);
  }
  var map_url=$('#container').attr('mindmap');
  var mapId=$('#container').attr('mapid');

  var load_content = function (jsonDocument) {
    var idea = content(jsonDocument);
    initCanvas(idea);
    attach_menu_listeners(idea);
    logMapActivity('View',mapId);
    updateTitle(idea.title);
    wasRelevantOnLoad=isMapRelevant(idea);
  };
  var loadAlertDiv=showAlert('Please wait, loading the map...','<i class="icon-spinner icon-spin"></i>');
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
  $('.modal').on('show', function () {
    mapModel.setInputEnabled(false);
  });
  $('.modal').on('hidden', function () {
    mapModel.setInputEnabled(true);
  });
  $('#floating-toolbar').draggable({containment:'window'});
  $('#floating-toolbar button.close').click(function(){
    if ($('#toolbar-inner').is(':visible')){
      $('#toolbar-inner').hide();
      $('.icon-resize-small','#floating-toolbar').removeClass("icon-resize-small").addClass("icon-resize-full");
    }
    else {
      $('#toolbar-inner').show(); 
      $('.icon-resize-full','#floating-toolbar').addClass("icon-resize-small").removeClass("icon-resize-full");
    }
  });


  $(window).bind('beforeunload', function() {
    if (changed && !saving) {
      return 'There are unsaved changes.';
    }});
});
