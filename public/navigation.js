/*global MM, observable*/
MM.navigation = function (config) {
	'use strict';
	observable(this);
	var self = this,
		getMapIdFromHash = function () {
			var windowHash = window && window.location && window.location.hash;
			return windowHash && windowHash.length && windowHash.length > 1 && windowHash.substring && windowHash.substring(1);
		};

	self.currentMapId = function () {
		return getMapIdFromHash() || config.mapId;
	};
	self.wireLinkForMapId = function (newMapId, link) {
		if (getMapIdFromHash()) {
			link.attr('href', '#');
			link.click(function () {self.changeMapId(newMapId); });
		} else {
			link.attr('href', '/map/' + newMapId);
		}
	};
	self.changeMapId = function (newMapId) {
		if (newMapId && newMapId === self.currentMapId()) {
			return false;
		}
		if (getMapIdFromHash()) {
			window.location.hash = newMapId;
			self.dispatchEvent('mapIdChanged', newMapId);
			return true;
		} else {
			document.location = '/map/' + newMapId;
		}
	};
	return self;
};