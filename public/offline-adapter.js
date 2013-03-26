/*global jQuery, MM, _*/
MM.OfflineAdapter = function (storage) {
	'use strict';
	var offlineStorageSlotName = 'offline-maps';
	this.description = 'OFFLINE';
	this.recognises = function (mapId) {
		return mapId && mapId[0] === 'o';
	};
	this.loadMap = function (mapId) {
		var result = jQuery.Deferred(),
			offlineMaps = storage.getItem(offlineStorageSlotName),
			idea = offlineMaps && offlineMaps[mapId] && offlineMaps[mapId].idea;
		if (idea) {
			result.resolve(idea, mapId, 'application/json');
		} else {
			result.reject('not-found');
		}
		return result.promise();
	};
	this.saveMap = function (mapInfo) {
		var result = jQuery.Deferred(),
			offlineMaps = storage.getItem(offlineStorageSlotName) || {},
			resultMapInfo = _.clone(mapInfo);
		resultMapInfo.mapId = 'o' + resultMapInfo.idea.title.replace(/ /g, '+');
		offlineMaps[resultMapInfo.mapId] = offlineMaps[resultMapInfo.mapId] || {};
		offlineMaps[resultMapInfo.mapId].idea = resultMapInfo.idea;
		storage.setItem(offlineStorageSlotName, offlineMaps);
		result.resolve(resultMapInfo);
		return result.promise();
	};
};
