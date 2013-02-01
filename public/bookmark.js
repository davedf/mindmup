var MM=MM || {};
MM.JSONStorage = function (storage){
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
  self = {},
  list=[];
  if (storage && storageKey){
    list=storage.getItem(storageKey);
  }
  self.store = function (bookmark){
    var existing=_.find(list, function(b) { return b.title==bookmark.title });
    if (existing) existing.url=bookmark.url;
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
  return self;
}
