describe ("Magic bookmark manager", function(){
  describe ("store", function() {
    var bookmark,url;
    beforeEach(function(){
      bookmark=new MM.Bookmark(3);
      url={mapId:'abcd', title:'defh'};
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
      var url2={mapId: 'xkcd', title: 'ssss' } 
      bookmark.store (url);
      bookmark.store (url2);
      expect(bookmark.list()).toEqual([url2,url]);
    });
    it ("should update a bookmark if one with the same title already exists", function(){
      updated= {mapId: 'xxx', title: url.title}
      bookmark.store (url);
      bookmark.store (updated);
      expect(_.size(bookmark.list())).toBe(1);
      expect(bookmark.list()[0]).toEqual(updated);
    });
    it ("fails if mapId or title are not provided", function(){
      bookmark.store (url);
      expect(function(){bookmark.store ({title:'zeka'}) }).toThrow(new Error("Invalid bookmark"));
      expect(function(){bookmark.store ({mapId:'zeka'}) }).toThrow(new Error("Invalid bookmark"));
      expect(function(){bookmark.store ({mapId: '', title:'zeka'}) }).toThrow(new Error("Invalid bookmark"));
      expect(function(){bookmark.store ({mapId:'zeka', title:''}) }).toThrow(new Error("Invalid bookmark"));
      expect(_.size(bookmark.list())).toBe(1);
      expect(bookmark.list()[0]).toEqual(url);
    });
    it ("should kick items off the list if over capacity, by age", function(){
      url1={mapId:'abcd1', title:'defh1'};
      url2={mapId:'abcd2', title:'defh2'};
      url3={mapId:'abcd3', title:'defh3'};
      bookmark.store(url);
      bookmark.store(url1);
      bookmark.store(url2);
      bookmark.store(url3);
      expect(bookmark.list()).toEqual([url3,url2,url1]);
    });
  });
  it ("should return a read-only copy of the list", function(){
    var bookmark=new MM.Bookmark(3);
    bookmark.store ({mapId:'xx', title:'yy'});
    var original=bookmark.list();
    var modified=bookmark.list();
    modified.push(1);
    expect(bookmark.list()).toEqual(original);
    expect(bookmark.list()).not.toEqual(modified);
  });
  it ("should load from storage on init if provided", function(){
    url={mapId:'abc', title:'def'}
    var storage={getItem:function(item){ if (item=='book') return [url]}};
    var bookmark=new MM.Bookmark(3, storage, 'book');
    expect(bookmark.list()).toEqual([url]);
  });
  it ("should ignore storage if it does not contain a bookmark store", function(){
    var storage={getItem:function(item){ return undefined;}};
    var bookmark=new MM.Bookmark(3, storage, 'book');
    expect(bookmark.list()).toEqual([]);
  });
  it ("should save bookmarks to storage on store if provided", function(){
    url={mapId:'abc', title:'def'}
    var storage={getItem:function(item){ return []}, setItem: function (key,value) {}};
    spyOn(storage,'setItem');
    var bookmark=new MM.Bookmark(3, storage, 'book');
    bookmark.store(url);
    expect(storage.setItem).toHaveBeenCalledWith('book',[url]);
  });
});

describe ("JSONStorage", function(){
  var json,storage;
  beforeEach(function(){
    storage={getItem:function(item){}, setItem: function (key,value) {}};
    json=MM.jsonStorage(storage);
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

describe ("Bookmark widget", function(){
  it ("appends a message about the intention of the menu if the bookmark list is empty", function(){
    var bookmark=new MM.Bookmark(5);
    var list=jQuery("<ul></ul>").bookmarkWidget(bookmark);
    expect(list.children('li').length).toBe(1);
    expect(list.text()).toBe('Save a map and it will appear in this list');
  });
  it ("creates links for bookmarks to /map/[mapId]", function(){
    var bookmark=new MM.Bookmark(5);
    bookmark.store({mapId:'u1', title:'t1'});
    var list=jQuery("<ul></ul>").bookmarkWidget(bookmark);
    expect(list.children('li').length).toBe(1);
    var link=list.children('li').children().first();
    expect(link).toBe('a');
    expect(link.attr('href')).toBe("/map/u1");
    expect(link.text()).toBe("t1");
  });
  it ("attaches activity log events to clicks if provided", function(){
    var bookmark=new MM.Bookmark(5), mockLog={log:function(){}};
    spyOn(mockLog,'log');
    bookmark.store({mapId:'u1', title:'t1'});
    var list=jQuery("<ul></ul>").bookmarkWidget(bookmark,10,mockLog);
    expect(list.children('li').length).toBe(1);
    var link=list.children('li').children().first();
    link.attr('href','#'); //prevent redirection
    link.click();
    expect(mockLog.log).toHaveBeenCalledWith("Top Bar","Bookmark click");
  });
  it ("cuts down long titles", function(){
    var bookmark=new MM.Bookmark(5);
    bookmark.store({mapId:'u1', title:'this is a very very long title indeed and should not be displayed in full, instead it should be cut down'});
    var list=jQuery("<ul></ul>").bookmarkWidget(bookmark,30);
    var link=list.children('li').children().first();
    expect(link.text()).toBe("this is a very very long title...");
  });
  it ("links are listed in reverse order as hyperlinks", function(){
    var bookmark=new MM.Bookmark(5);
    bookmark.store({mapId:'u1', title:'t1'});
    bookmark.store({mapId:'u2', title:'t2'});
    bookmark.store({mapId:'u3', title:'t3'});
    var list=jQuery("<ul></ul>").bookmarkWidget(bookmark);
    expect(list.children('li').length).toBe(3);
    expect (list.children('li').children().first().attr('href')).toBe("/map/u3");
    expect (list.children('li').children().last().attr('href')).toBe("/map/u1");
  });
});
