/*jslint forin: true*/
/*global content, jQuery, MM, observable, setTimeout, window */
MM.MapRepository = function (activityLog, alert, publicrepository, privateRepository) {
	'use strict';
	observable(this);
	var dispatchEvent = this.dispatchEvent,
		mapInfo,
		onMapLoaded = function (newMapInfo) {
			mapInfo = newMapInfo;
			dispatchEvent('mapLoaded', newMapInfo.idea, newMapInfo.mapId);
		},
		onBeforeUpload = function (id, idea) {
			dispatchEvent('Before Upload', id, idea);
		},
		onMapSaved = function (savedMapInfo) {
			mapInfo = savedMapInfo;
		},
		onMapLoading = function (mapUrl, mapId) {
			dispatchEvent('mapLoading', mapUrl, mapId);
		},
		onMapLoadFailed = function (mapUrl, reason) {
			dispatchEvent('mapLoadingFailed', mapUrl, reason);
		},
		onMapSavingFailed = function () {
			dispatchEvent('mapSavingFailed');
		},
		onMapSaving = function () {
			dispatchEvent('mapSaving');
		};
	MM.MapRepository.activityTracking(this, activityLog);
	MM.MapRepository.alerts(this, alert);
	MM.MapRepository.toolbarAndUnsavedChangesDialogue(this, activityLog);
	publicrepository.addEventListener('mapLoading', onMapLoading);
	publicrepository.addEventListener('mapLoaded', onMapLoaded);
	publicrepository.addEventListener('mapSaving', onMapSaving);
	publicrepository.addEventListener('mapLoadingFailed', onMapLoadFailed);
	publicrepository.addEventListener('mapSavingFailed', onMapSavingFailed);
	publicrepository.addEventListener('Before Upload', onBeforeUpload);
	this.loadMap = function (mapId) {
		publicrepository.loadMap(mapId);
	};

	this.publishMap = function () {
		publicrepository.saveMap(mapInfo);
	};
};

MM.MapRepository.activityTracking = function (mapRepository, activityLog) {
	'use strict';
	var startedFromNew = function (idea) {
		return idea.id === 1;
	},
		isNodeRelevant = function (ideaNode) {
			return ideaNode.title && ideaNode.title.search(/MindMup|Lancelot|cunning|brilliant|Press Space|famous|Luke|daddy/) === -1;
		},
		isNodeIrrelevant = function (ideaNode) {
			return !isNodeRelevant(ideaNode);
		},
		isMapRelevant = function (idea) {
			return startedFromNew(idea) && idea.find(isNodeRelevant).length > 5 && idea.find(isNodeIrrelevant).length < 3;
		},
		wasRelevantOnLoad;
	mapRepository.addEventListener('mapLoading', function (mapUrl, mapId) {
		activityLog.log('loading map [' + mapUrl + ']');
	});
	mapRepository.addEventListener('mapLoaded', function (idea, mapId) {
		activityLog.log('Map', 'View', mapId);
		wasRelevantOnLoad = isMapRelevant(idea);
	});
	mapRepository.addEventListener('mapLoadingFailed', function (mapUrl, reason) {
		activityLog.error('Error loading map document [' + mapUrl + '] ' + reason);
	});
	mapRepository.addEventListener('Before Upload', function (id, idea) {
		if (isMapRelevant(idea) && !wasRelevantOnLoad) {
			activityLog.log('Map', 'Created Relevant', id);
		} else if (wasRelevantOnLoad) {
			activityLog.log('Map', 'Saved Relevant', id);
		} else {
			activityLog.log('Map', 'Saved Irrelevant', id);
		}
	});
	mapRepository.addEventListener('mapSavingFailed', function () {
		activityLog.error('Map save failed');
	});
};
MM.MapRepository.alerts = function (mapRepository, alert) {
	'use strict';
	var alertId;
	mapRepository.addEventListener('mapLoading', function () {
		alertId = alert.show('Please wait, loading the map...', '<i class="icon-spinner icon-spin"></i>');
	});
	mapRepository.addEventListener('mapLoaded', function () {
		alert.hide(alertId);
	});
	mapRepository.addEventListener('mapLoadingFailed', function () {
		alert.hide(alertId);
		alert.show(
			'Unfortunately, there was a problem loading the map.',
			'An automated error report was sent and we will look into this as soon as possible',
			'error'
		);
	});
	mapRepository.addEventListener('mapSavingFailed', function () {
		alert.show(
			'Unfortunately, there was a problem saving the map.',
			'Please try again later. We have sent an error report and we will look into this as soon as possible',
			'error'
		);
	});
};
MM.MapRepository.toolbarAndUnsavedChangesDialogue = function (mapRepository, activityLog) {
	'use strict';
	var changed, saving;
	mapRepository.addEventListener('mapLoaded', function (idea) {
		jQuery(window).bind('beforeunload', function () {
			if (changed && !saving) {
				return 'There are unsaved changes.';
			}
		});
		idea.addEventListener('changed', function (command, args) {
			saving = false;
			if (!changed) {
				jQuery('#toolbarShare').hide();
				jQuery('#toolbarSave').show();
				jQuery('#menuExport').hide();
				jQuery('#menuPublish').effect('highlight');
				activityLog.log('Map', 'Edit');
				changed = true;
			}
			activityLog.log(['Map', command].concat(args));
		});
	});
	mapRepository.addEventListener('Before Upload', function () {
		saving = true;
	});
	mapRepository.addEventListener('mapSaving', function () {
		saving = true;
	});
	mapRepository.addEventListener('mapSavingFailed', function () {
		jQuery('#menuPublish').text('Save').addClass('btn-primary').attr('disabled', false);
		jQuery('#toolbarSave p').show();
	});
};
