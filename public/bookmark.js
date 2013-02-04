var MM=MM || {};
MM.jsonStorage = function (storage){
  var self={}, internalStorage=storage;
  self.setItem = function (key,value){
    internalStorage.setItem(key, JSON.stringify(value));
  };
  self.getItem = function (key){
    return JSON.parse(internalStorage.getItem(key));
  };
  return self;
}
MM.Bookmark = function (maxSize, storage, storageKey){
  var capacity=maxSize,
  self = this,
  list=[];
  if (storage && storageKey){
    list=storage.getItem(storageKey)||[];
  }
  self.store = function (bookmark){
    if (!(bookmark.mapId && bookmark.title)) throw new Error("Invalid bookmark");
    var existing=_.find(list, function(b) { return b.title==bookmark.title });
    if (existing) existing.mapId=bookmark.mapId;
    else {
      if (list.length>=capacity) list.shift();
      list.push(_.clone(bookmark));
    }
    if (storage && storageKey){
      storage.setItem(storageKey,list);
    }
  }
  self.list = function (){
    return _.clone(list).reverse();
  }
}
jQuery.fn.bookmarkWidget = function (bookmarkMgr,titleLimit,activityLog){
  titleLimit=titleLimit||30; 
	return this.each(function () {
		var element = jQuery(this), list= bookmarkMgr.list();
    if (list.length==0)
     $("<li>Save a map and it will appear in this list</li>").appendTo(element);
    else {
      _.each(list, function(bookmark){
        var link=$("<a></a>").appendTo($("<li></li>").appendTo(element)), title=bookmark.title;
        link.attr('href',"/map/"+bookmark.mapId);
        if (title.length>titleLimit) title=title.substr(0,titleLimit)+"...";
        link.text(title);
        if (activityLog){
          link.click(function(){
            activityLog.log("Top Bar","Bookmark click");
          });
        }
      });
    }
  }); 
}
