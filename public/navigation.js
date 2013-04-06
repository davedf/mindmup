/*global MM*/
MM.navigation = function (config) {
	'use strict';
	var self = this;
	self.currentMapId = function () {
		var windowHash = window && window.location && window.location.hash,
			mapIdFromHash = windowHash && windowHash.length && windowHash.length > 1 && windowHash.substring && windowHash.substring(1);
		return mapIdFromHash || config.mapId;
	};
	return self;
};