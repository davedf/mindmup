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
	self.remove = function (key) {
		storage.removeItem(key);
	};
	return self;
};
MM.Bookmark = function (mapRepository, storage, storageKey) {
	'use strict';
	var self = observable(this),
		currentMap = false,
		list = [],
		pushToStorage = function () {
			if (storage && storageKey) {
				storage.setItem(storageKey, list);
			}
		};
	if (storage && storageKey) {
		list = storage.getItem(storageKey) || [];
	}
	mapRepository.addEventListener('mapSaved', function (key, idea) {
		self.store({
			mapId: key,
			title: idea.title
		});
	});
	mapRepository.addEventListener('mapLoaded', function (idea, key) {
		var couldPin = self.canPin();
		currentMap = {
			mapId: key,
			title: idea.title
		};
		if (couldPin !== self.canPin()) {
			self.dispatchEvent('pinChanged');
		}
	});
	self.store = function (bookmark) {
		if (!(bookmark.mapId && bookmark.title)) {
			throw new Error("Invalid bookmark");
		}
		var existing = _.find(list, function (b) {
			return (b.title === bookmark.title) || (b.mapId === bookmark.mapId);
		});
		if (existing) {
			existing.mapId = bookmark.mapId;
			existing.title = bookmark.title;
		} else {
			list.push(_.clone(bookmark));
		}
		pushToStorage();
		self.dispatchEvent('added', bookmark);
	};
	self.remove = function (mapId, suppressAlert) {
		var idx, removed;
		suppressAlert = suppressAlert || false;
		for (idx = 0; idx < list.length; idx++) {
			if (list[idx].mapId === mapId) {
				removed = list.splice(idx, 1)[0];
				pushToStorage();
				self.dispatchEvent('deleted', removed, suppressAlert);
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
				title: element.title,
				shortTitle: element.title.length > titleLimit ? element.title.substr(0, titleLimit) + "..." : element.title,
				mapId: element.mapId
			};
		});
	};
	self.pin = function () {
		if (currentMap) {
			self.store(currentMap);
		}
	};
	self.canPin = function () {
		return currentMap && (list.length === 0 || _.every(list, function (bookmark) {
			return bookmark.mapId !== currentMap.mapId;
		}));
	};
};
jQuery.fn.bookmarkWidget = function (bookmarks, alert, addTooltips) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
			alertId,
			template = element.find('.template').clone(),
		    originalContent = element.children().clone(),
			keep = element.children().filter('[data-mm-role=bookmark-keep]').clone(),
			pin = element.children().filter('[data-mm-role=bookmark-pin]').clone(),
			updateLinks = function () {
				var list = bookmarks.links(),
					link,
					children,
					addition;
				element.empty();
				if (list.length) {
					list.slice(0, 10).forEach(function (bookmark) {
						addition = template.clone().show().appendTo(element);
						link = addition.find('a');
						children = link.children().detach();
						link.attr('href', bookmark.url).text(bookmark.shortTitle).addClass('repo-' + bookmark.mapId[0]);
						children.appendTo(link);
						addition.find('[data-mm-role=bookmark-delete]').click(function () {
							bookmarks.remove(bookmark.mapId);
							element.parents('.dropdown').find('.dropdown-toggle').dropdown('toggle');
							return false;
						});
					});
					keep.clone().appendTo(element);
					if (bookmarks.canPin()) {
						pin.clone().appendTo(element).find('a').click(function () {
							bookmarks.pin();
						});
					}
				} else {
					originalContent.clone().appendTo(element).filter('[data-mm-role=bookmark-pin]').find('a').click(function () {
						bookmarks.pin();
					});
				}
			};
		bookmarks.addEventListener('added', updateLinks);
		bookmarks.addEventListener('pinChanged', updateLinks);
		bookmarks.addEventListener('deleted', function (mark, suppressAlert) {
			updateLinks();
			if (alert && !suppressAlert) {
				if (alertId) {
					alert.hide(alertId);
				}
				alertId = alert.show("Bookmark Removed.", mark.title + " was removed from the list of your maps. <a href='#'> Undo </a> ", "success");
				jQuery('.alert-no-' + alertId).find('a').click(function () {
					bookmarks.store(mark);
					alert.hide(alertId);
				});
			}
		});
		updateLinks();
	});
};
