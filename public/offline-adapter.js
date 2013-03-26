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
			stored = storage.getItem(mapId) || {},
			map = stored.map;
		if (map) {
			result.resolve(map, mapId, 'application/json');
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
			storage.setItem(resultMapInfo.mapId, { map: resultMapInfo.idea });
		} catch (e) {
			return result.reject('local-storage-failed', e.toString()).promise();
		}
		return result.resolve(resultMapInfo).promise();
	};
};
MM.OfflineFallback = function (storage) {
	'use strict';
	var localStoragePrefix = 'fallback-';
	this.saveMap = function (mapId, map) {
		storage.setItem(localStoragePrefix + mapId, { map: map });
	};
	this.loadMap = function (mapId) {
		var entry = storage.getItem(localStoragePrefix + mapId);
		return entry && entry.map;
	};
	this.remove = function (mapId) {
		storage.remove(localStoragePrefix + mapId);
	};
};
