describe ("Magic bookmark manager", function(){
  describe ("store", function() {
    var mapRepository,bookmark,url;
    beforeEach(function(){
			mapRepository = observable({});
      bookmark=new MM.Bookmark(mapRepository,3);
      url={mapId:'abcd', title:'defh'};
    });
	it("should invoke store method when mapRepository dispatches Before Upload event", function(){
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
    var bookmark=new MM.Bookmark(observable({}),3);
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
    var bookmark=new MM.Bookmark(observable({}), 3, storage, 'book');
    expect(bookmark.list()).toEqual([url]);
  });
  it ("should ignore storage if it does not contain a bookmark store", function(){
    var storage={getItem:function(item){ return undefined;}};
    var bookmark=new MM.Bookmark(observable({}), 3, storage, 'book');
    expect(bookmark.list()).toEqual([]);
  });
  it ("should save bookmarks to storage on store if provided", function(){
    url={mapId:'abc', title:'def'}
    var storage={getItem:function(item){ return []}, setItem: function (key,value) {}};
    spyOn(storage,'setItem');
    var bookmark=new MM.Bookmark(observable({}), 3, storage, 'book');
    bookmark.store(url);
    expect(storage.setItem).toHaveBeenCalledWith('book',[url]);
  });
  it ("converts a list of bookmarks to links by appending /map and cutting down long titles", function(){
    var bookmark=new MM.Bookmark(observable({}), 5);
    bookmark.store({mapId:'u1', title:'this is a very very long title indeed and should not be displayed in full, instead it should be cut down'});
    expect(bookmark.links()).toEqual([{url:'/map/u1', title:'this is a very very long title...'}]);
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
  var ulTemplate='<ul><li>Old</li><li class="template" style="display:none"><a data-category="Top Bar" data-event-type="Bookmark click"></a></li></ul>';
                
  it ("does not remove previous content if the bookmark list is empty", function(){
    var list=jQuery(ulTemplate).bookmarkWidget([]);
    expect(list.children('li').length).toBe(2);
    expect(list.children('li').first().text()).toBe('Old');
  });
  it ("removes previous content if the list is not empty", function(){
    var list=jQuery(ulTemplate).bookmarkWidget([{url:'x',title:'y'}]);
    expect(list.children('li').length).toBe(1);
    expect(list.children('li').first().children().first()).toBe('a');
  });
  it ("links are listed in same order as hyperlinks", function(){
    var links=[{url:'u1', title:'t1'},
		{url:'u2', title:'t2'},
		{url:'u3', title:'t3'}];
    var list=jQuery(ulTemplate).bookmarkWidget(links);
    expect (list.children('li').length).toBe(3);
    expect (list.children('li').children().first().attr('href')).toBe("u1");
    expect (list.children('li').children().first().text()).toBe("t1");
    expect (list.children('li').children().last().attr('href')).toBe("u3");
    expect (list.children('li').children().last().text()).toBe("t3");
  });
});
