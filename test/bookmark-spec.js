describe ("Magic bookmark manager", function(){
  describe ("store", function() {
    var bookmark,url;
    beforeEach(function(){
      bookmark=MM.Bookmark(3);
      url={url:'abcd', title:'defh'};
    });
    it ("should store a bookmark if it is not already in the list", function(){
      bookmark.store (url);
      expect(bookmark.list()).toEqual([url]);
    });
    it ("should store a read only copy of a bookmark", function(){
      bookmark.store (url);
      var original=url.title;
      url.title='new';
      expect(bookmark.list()[0].title).toEqual(original);
    });
    it ("should store different bookmarks ordered by recency ", function(){
      var url2={url: 'xkcd', title: 'ssss' } 
      bookmark.store (url);
      bookmark.store (url2);
      expect(bookmark.list()).toEqual([url2,url]);
    });
    it ("should update a bookmark if one with the same title already exists", function(){
      updated= {url: 'xxx', title: url.title}
      bookmark.store (url);
      bookmark.store (updated);
      expect(_.size(bookmark.list())).toBe(1);
      expect(bookmark.list()[0]).toEqual(updated);
    });
    it ("should kick items off the list if over capacity, by age", function(){
      url1={url:'abcd1', title:'defh1'};
      url2={url:'abcd2', title:'defh2'};
      url3={url:'abcd3', title:'defh3'};
      bookmark.store(url);
      bookmark.store(url1);
      bookmark.store(url2);
      bookmark.store(url3);
      expect(bookmark.list()).toEqual([url3,url2,url1]);
    });
  });
  it ("should return a read-only copy of the list", function(){
    var bookmark=MM.Bookmark(3);
    bookmark.store ({url:'xx', title:'yy'});
    var original=bookmark.list();
    var modified=bookmark.list();
    modified.push(1);
    expect(bookmark.list()).toEqual(original);
    expect(bookmark.list()).not.toEqual(modified);
  });
  it ("should load from storage on init if provided", function(){
    url={url:'abc', title:'def'}
    var storage={getItem:function(item){ if (item=='book') return [url]}};
    var bookmark=MM.Bookmark(3, storage, 'book');
    expect(bookmark.list()).toEqual([url]);
  });
  it ("should save to storage on store if provided", function(){
    url={url:'abc', title:'def'}
    var storage={getItem:function(item){ return []}, setItem: function (key,value) {}};
    spyOn(storage,'setItem');
    var bookmark=MM.Bookmark(3, storage, 'book');
    bookmark.store(url);
    expect(storage.setItem).toHaveBeenCalledWith('book',[url]);
  });
});

describe ("JSONStorage", function(){
  var json,storage;
  beforeEach(function(){
    storage={getItem:function(item){}, setItem: function (key,value) {}};
    json=MM.JSONStorage(storage);
  });
  it ("stringifies items past into setItem before passing on", function(){
    spyOn(storage,'setItem');
    json.setItem('bla',{a:'b'});
    expect(storage.setItem).toHaveBeenCalledWith('bla','{"a":"b"}');
  });
  it ("destringifies items from getItem after delegation", function(){
    spyOn(storage,'getItem').andReturn('{"a":"b"}');
    expect(json.getItem('bla')).toEqual({a:'b'});
    expect(storage.getItem).toHaveBeenCalledWith('bla');
  });
});
