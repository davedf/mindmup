/*global MM, observable, $, _*/
MM.navigation = function (config) {
	'use strict';
	observable(this);
	var self = this,
		getMapIdFromHash = function () {
			var windowHash = window && window.location && window.location.hash;
			return windowHash && windowHash.length && windowHash.length > 1 && windowHash.substring && windowHash.substring(1);
		},
		calcCurrentMapId = function () {
			return getMapIdFromHash() || config.mapId;
		},
		currentMapId = calcCurrentMapId();

	self.currentMapId = calcCurrentMapId;
	self.wireLinkForMapId = function (newMapId, link) {
		if (getMapIdFromHash()) {
			link.attr('href', '#' + newMapId);
			link.data('link-fixed', 'true');
			link.click(function () {self.changeMapId(newMapId); });
		} else {
			link.attr('href', '/map/' + newMapId);
		}
	};
	self.setSimpleLink = function (link) {
		var mapId = getMapIdFromHash();
		if (mapId && !$(link).data('link-fixed')) {
			$(link).attr('href', '#' + mapId);
		}
	};
	self.changeMapId = function (newMapId) {
		if (newMapId && currentMapId && newMapId === currentMapId) {
			return false;
		}
		var previousMapId = currentMapId;
		currentMapId = newMapId;
		if (getMapIdFromHash()) {
			window.location.hash = newMapId;
			self.dispatchEvent('mapIdChanged', newMapId, previousMapId);
			return true;
		} else {
			document.location = '/map/' + newMapId;
		}
	};
	return self;
};

$.fn.navigationWidget = function (navigation) {
	'use strict';
	var self = this,
		mapIdRegEx = /\/[Mm]ap\/([^\/]*)/,
		setSimpleLinks = function (newMapId, previousMapId) {
			_.each(self.find('a[href="#"]'), function (link) {
				navigation.setSimpleLink(link);
			});
			if (previousMapId) {
				_.each(self.find('a[href="#' + previousMapId + '"]'), function (link) {
					navigation.setSimpleLink(link);
				});
			}
		};
	_.each(self.find('a'), function (link) {
		var $link = $(link),
			href = $link.attr('href'),
			result = mapIdRegEx.exec(href);
		if (result && result[1]) {
			navigation.wireLinkForMapId(result[1], $link);
		}
	});
	setSimpleLinks(navigation.currentMapId());
	navigation.addEventListener('mapIdChanged', function (newMapId, previousMapId) {
		setSimpleLinks(newMapId, previousMapId);
	});
	return self;
};