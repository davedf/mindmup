/*global _, jQuery, beforeEach, MM, observable*/
MM.jsonStorage = function (storage) {
	'use strict';
	var self = {};
	self.setItem = function (key, value) {
		storage.setItem(key, JSON.stringify(value));
	};
	self.getItem = function (key) {
		try {
			return JSON.parse(storage.getItem(key));
		} catch (e) {
			return undefined;
		}
	};
	return self;
};
MM.Bookmark = function (mapRepository, storage, storageKey) {
	'use strict';
	var self = observable(this),
		list = [],
		pushToStorage = function () {
			if (storage && storageKey) {
				storage.setItem(storageKey, list);
			}
		};
	if (storage && storageKey) {
		list = storage.getItem(storageKey) || [];
	}
	mapRepository.addEventListener('Before Upload', function (key, idea) {
		self.store({
			mapId: key,
			title: idea.title
		});
	});
	self.store = function (bookmark) {
		if (!(bookmark.mapId && bookmark.title)) {
			throw new Error("Invalid bookmark");
		}
		var existing = _.find(list, function (b) {
			return b.title === bookmark.title;
		});
		if (existing) {
			existing.mapId = bookmark.mapId;
		} else {
			list.push(_.clone(bookmark));
		}
		pushToStorage();


	};
	self.remove = function (mapId) {
		var idx, removed;
		for (idx = 0; idx < list.length; idx++) {
			if (list[idx].mapId === mapId) {
				removed = list.splice(idx, 1)[0];
				pushToStorage();
				self.dispatchEvent('deleted', removed);
				return;
			}
		}


	};
	self.list = function () {
		return _.clone(list).reverse();
	};
	self.links = function (titleLimit) {
		titleLimit = titleLimit || 30;
		return _.map(self.list(), function (element) {
			return {
				url: "/map/" + element.mapId,
				title: element.title.length > titleLimit ? element.title.substr(0, titleLimit) + "..." : element.title,
				mapId: element.mapId
			};
		});
	};
};
jQuery.fn.bookmarkWidget = function (bookmarks) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
			template = element.find('.template').clone(),
			updateLinks = function () {
				var list = bookmarks.links(),
					link,
					children,
					addition;
				if (list.length) {
					element.empty();
					list.slice(0, 10).forEach(function (bookmark) {
						addition = template.clone().show().appendTo(element);
						link = addition.find('a');
						children = link.children().detach();
						link.attr('href', bookmark.url).text(bookmark.title);
						children.appendTo(link);
						addition.find('[data-mm-role=bookmark-delete]').click(function () {
							bookmarks.remove(bookmark.mapId);
							return false;
						});
					});
				}
			};
		bookmarks.addEventListener('deleted', function () {
			updateLinks();
		});
		updateLinks();
	});
};
