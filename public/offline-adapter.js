/*global jQuery, MM, _*/
MM.OfflineAdapter = function (storage) {
	'use strict';
	var offlineStorageSlotName = 'offline-map';
	this.description = 'OFFLINE';
	this.recognises = function (mapId) {
		return mapId && mapId[0] === 'o';
	};
	this.loadMap = function (mapId) {
		var result = jQuery.Deferred(),
			idea = storage.getItem(mapId).idea;
		if (idea) {
			result.resolve(idea, mapId, 'application/json');
		} else {
			result.reject('not-found');
		}
		return result.promise();
	};
	this.saveMap = function (mapInfo) {
		var result = jQuery.Deferred(),
			resultMapInfo = _.clone(mapInfo),
			offlineMaps = storage.getItem('offline-maps') || { nextMapId: 1 };
		try {
			if (!this.recognises(mapInfo.mapId)) {
				resultMapInfo.mapId = offlineStorageSlotName + '-' + offlineMaps.nextMapId;
				offlineMaps.nextMapId++;
				storage.setItem('offline-maps', offlineMaps);
			}
			storage.setItem(resultMapInfo.mapId, { idea: resultMapInfo.idea });
		} catch (e) {
			return result.reject('failed-offline').promise();
		}
		return result.resolve(resultMapInfo).promise();
	};
};
