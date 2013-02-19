/*global jasmine, _, observable, beforeEach, describe, expect, it, jasmine, jQuery, spyOn, MM*/
describe("Magic bookmark manager", function () {
	'use strict';
	describe("store", function () {
		var mapRepository, bookmark, url;
		beforeEach(function () {
			mapRepository  =  observable({});
			bookmark  =  new MM.Bookmark(mapRepository);
			url = {mapId: 'abcd', title: 'defh'};
		});
		it("should invoke store method when mapRepository dispatches Before Upload event", function () {
			bookmark.store(url);
			expect(bookmark.list()).toEqual([url]);
		});
		it("should store a read only copy of a bookmark", function () {
			bookmark.store(url);
			var original = url.title;
			url.title = 'new';
			expect(bookmark.list()[0].title).toEqual(original);
		});
		it("should store different bookmarks ordered by recency ", function () {
			var url2 = {mapId: 'xkcd', title: 'ssss'};
			bookmark.store(url);
			bookmark.store(url2);
			expect(bookmark.list()).toEqual([url2, url]);
		});
		it("should update a bookmark if one with the same title already exists", function () {
			var updated = {mapId:  'xxx', title:  url.title};
			bookmark.store(url);
			bookmark.store(updated);
			expect(_.size(bookmark.list())).toBe(1);
			expect(bookmark.list()[0]).toEqual(updated);
		});
		it("fails if mapId or title are not provided", function () {
			bookmark.store(url);
			expect(function () {bookmark.store({title: 'zeka'}); }).toThrow(new Error("Invalid bookmark"));
			expect(function () {bookmark.store({mapId: 'zeka'}); }).toThrow(new Error("Invalid bookmark"));
			expect(function () {bookmark.store({mapId:  '', title: 'zeka'}); }).toThrow(new Error("Invalid bookmark"));
			expect(function () {bookmark.store({mapId: 'zeka', title: ''}); }).toThrow(new Error("Invalid bookmark"));
			expect(_.size(bookmark.list())).toBe(1);
			expect(bookmark.list()[0]).toEqual(url);
		});
		it("should save bookmarks to storage on store if provided", function () {
			var url = {mapId: 'abc', title: 'def'}, bookmark,
				storage = {getItem: function (item) { return []; }, setItem:  function (key, value) {}};
			spyOn(storage, 'setItem');
			bookmark = new MM.Bookmark(observable({}), storage, 'book');
			bookmark.store(url);
			expect(storage.setItem).toHaveBeenCalledWith('book', [url]);
		});
		it("should dispatch a added event", function () {
			var url = {mapId: 'abc', title: 'def'},
				bookmark = new MM.Bookmark(observable({})),
				listener = jasmine.createSpy('removed');
			bookmark.addEventListener('added', listener);
			bookmark.store(url);
			expect(listener).toHaveBeenCalledWith(url);
		});
	});
	describe("remove", function () {
		it("removes a bookmark by mapId", function () {
			var bookmark = new MM.Bookmark(observable({})), remaining = {mapId: 'xx2', title: 'yy2'};
			bookmark.store({mapId: 'xx', title: 'yy'});
			bookmark.store(remaining);
			bookmark.remove('xx');
			expect(bookmark.list()).toEqual([remaining]);
		});
		it("stores the list to external storage if defined", function () {
			var url = {mapId: 'abc', title: 'def'}, bookmark,
				storage = {getItem: function (item) { return []; }, setItem:  function (key, value) {}};
			bookmark = new MM.Bookmark(observable({}), storage, 'book');
			bookmark.store(url);
			bookmark.store({mapId: 'xx', title: 'yy'});
			spyOn(storage, 'setItem');
			bookmark.remove('xx');
			expect(storage.setItem).toHaveBeenCalledWith('book', [url]);
		});
		it("fires a change event when a bookmark is deleted", function () {
			var bookmark = new MM.Bookmark(observable({})),
				mark = {mapId: 'xx', title: 'yy'},
				listener = jasmine.createSpy('removed');
			bookmark.store(mark);
			bookmark.addEventListener('deleted', listener);
			bookmark.remove('xx');
			expect(listener).toHaveBeenCalledWith(mark);
		});
	});
	it("should return a read-only copy of the list", function () {
		var bookmark = new MM.Bookmark(observable({})), original, modified;
		bookmark.store({mapId: 'xx', title: 'yy'});
		original = bookmark.list();
		modified = bookmark.list();
		modified.push(1);
		expect(bookmark.list()).toEqual(original);
		expect(bookmark.list()).not.toEqual(modified);
	});
	it("should load from storage on init if provided", function () {
		var url = {mapId: 'abc', title: 'def'},
			storage = {
				getItem: function (item) {
					if (item === 'book') {
						return [url];
					}
				}
			},
			bookmark = new MM.Bookmark(observable({}), storage, 'book');
		expect(bookmark.list()).toEqual([url]);
	});
	it("should ignore storage if it does not contain a bookmark store", function () {
		var storage = {getItem: function (item) { return undefined; }},
			bookmark = new MM.Bookmark(observable({}), storage, 'book');
		expect(bookmark.list()).toEqual([]);
	});


	it("converts a list of bookmarks to links by appending /map and cutting down long titles", function () {
		var bookmark = new MM.Bookmark(observable({}));
		bookmark.store({mapId: 'u1', title: 'this is a very very long title indeed and should not be displayed in full, instead it should be cut down'});
		expect(bookmark.links()).toEqual([{url: '/map/u1', title: 'this is a very very long title...', mapId: 'u1'}]);
	});
});

describe("JSONStorage", function () {
	'use strict';
	var json, storage;
	beforeEach(function () {
		storage = {getItem: function (item) {}, setItem:  function (key, value) {}};
		json = MM.jsonStorage(storage);
	});
	it("stringifies items past into setItem before passing on", function () {
		spyOn(storage, 'setItem');
		json.setItem('bla', {a: 'b'});
		expect(storage.setItem).toHaveBeenCalledWith('bla', '{"a":"b"}');
	});
	it("destringifies items from getItem after delegation", function () {
		spyOn(storage, 'getItem').andReturn('{"a": "b"}');
		expect(json.getItem('bla')).toEqual({a: 'b'});
		expect(storage.getItem).toHaveBeenCalledWith('bla');
	});
	it("returns undefined if the item is not JSON", function () {
		spyOn(storage, 'getItem').andReturn('{xxxxxx}');
		expect(json.getItem('bla')).toBeUndefined();
	});
});

describe("Bookmark widget", function () {
	'use strict';
	var ulTemplate = '<ul><li>Old</li><li class="template" style="display: none"><a data-category="Top Bar" data-event-type="Bookmark click"><span data-mm-role="x"></span></a></li></ul>',
		wrap = function (list) {
			return new MM.Bookmark(observable({}), { getItem: function () { return list; }, setItem: function () { } }, 'key');
		};
	it("does not remove previous content if the bookmark list is empty", function () {
		var list = jQuery(ulTemplate).bookmarkWidget(wrap([]));
		expect(list.children('li').length).toBe(2);
		expect(list.children('li').first().text()).toBe('Old');
	});
	it("removes previous content if the list is not empty", function () {
		var list = jQuery(ulTemplate).bookmarkWidget(wrap([{mapId: 'x', title: 'y'}]));
		expect(list.children('li').length).toBe(1);
		expect(list.children('li').first().children().first()).toBe('a');
	});
	it("links are listed in reverse order as hyperlinks", function () {
		var links = [{mapId: 'u1', title: 't1'},
			{mapId: 'u2', title: 't2'},
			{mapId: 'u3', title: 't3'}],
			list = jQuery(ulTemplate).bookmarkWidget(wrap(links));
		expect(list.children('li').length).toBe(3);
		expect(list.children('li').first().children('a').attr('href')).toBe("/map/u3");
		expect(list.children('li').first().children('a').text()).toBe("t3");
		expect(list.children('li').last().children('a').attr('href')).toBe("/map/u1");
		expect(list.children('li').last().children('a').text()).toBe("t1");
	});
	it("self-updates if a bookmark is deleted", function () {
		var links = [{mapId: 'u1', title: 't1'},
			{mapId: 'u2', title: 't2'},
			{mapId: 'u3', title: 't3'}],
			bookmark = wrap(links),
			list = jQuery(ulTemplate).bookmarkWidget(bookmark);
		bookmark.remove('u1');
		expect(list.children('li').length).toBe(2);
		expect(list.children('li').first().children('a').attr('href')).toBe("/map/u3");
		expect(list.children('li').last().children('a').attr('href')).toBe("/map/u2");
	});
	it("self-updates if a bookmark is added", function () {
		var	bookmark = wrap([]),
			list = jQuery(ulTemplate).bookmarkWidget(bookmark);
		bookmark.store({mapId: 'u1', title: 't1'});
		expect(list.children('li').length).toBe(1);
		expect(list.children('li').last().children('a').attr('href')).toBe("/map/u1");
	});
	it("puts back original content when all bookmarks are removed", function () {
		var links = [{mapId: 'u1', title: 't1'}],
			bookmark = wrap(links),
			list = jQuery(ulTemplate).bookmarkWidget(bookmark);
		bookmark.remove('u1');
		expect(list.children('li').length).toBe(2);
		expect(list.children('li').first().text()).toBe('Old');
	});
	it("displays only first 10 links", function () {
		var links = [], list, idx;
		for (idx = 0; idx < 12; idx++) {
			links.push({mapId: 'u' + idx, title: 't' + idx});
		}
		list = jQuery(ulTemplate).bookmarkWidget(wrap(links));
		expect(list.children('li').length).toBe(10);
		expect(list.children('li').first().children('a').attr('href')).toBe("/map/u11");
		expect(list.children('li').last().children('a').attr('href')).toBe("/map/u2");
	});
	it("preserves any children in the link", function () {
		var list = jQuery(ulTemplate).bookmarkWidget(wrap([{mapId: 'x', title: 'y'}]));
		expect(list.children('li').first().children().first().children()).toBe('span');
	});
});
