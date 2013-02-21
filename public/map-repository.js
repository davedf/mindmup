/*jslint forin: true*/
/*global content, jQuery, MM, observable, setTimeout, window, document*/
MM.MapRepository = function (activityLog, alert, publicrepository, privateRepository) {
	'use strict';
	observable(this);
	var dispatchEvent = this.dispatchEvent,
		mapInfo = {},
		listenType,
		listeners = {
			'mapLoaded': function (newMapInfo) {
				mapInfo = newMapInfo;
				dispatchEvent('mapLoaded', newMapInfo.idea, newMapInfo.mapId);
			},
			'Before Upload': function (id, idea) {
				dispatchEvent('Before Upload', id, idea);
			},
			'mapSaved': function (savedMapInfo) {
				dispatchEvent('mapSaved', savedMapInfo.mapId, savedMapInfo.idea);
				if (mapInfo.mapId !== savedMapInfo.mapId) {
					document.location = "/map/" + savedMapInfo.mapId;
				}
				mapInfo = savedMapInfo;
			},
			'mapLoading': function (mapUrl, mapId) {
				dispatchEvent('mapLoading', mapUrl, mapId);
			},
			'mapLoadingFailed': function (mapUrl, reason) {
				dispatchEvent('mapLoadingFailed', mapUrl, reason);
			},
			'mapSavingFailed': function () {
				dispatchEvent('mapSavingFailed');
			},
			'mapSaving': function () {
				dispatchEvent('mapSaving');
			}
		},
		usePrivateRepository = function (doThis, fail) {
			if (privateRepository.ready()) {
				doThis();
			} else {
				privateRepository.makeReady(doThis, fail);
			}
		};
	MM.MapRepository.activityTracking(this, activityLog);
	MM.MapRepository.alerts(this, alert);
	MM.MapRepository.toolbarAndUnsavedChangesDialogue(this, activityLog);
	for (listenType in listeners) {
		publicrepository.addEventListener(listenType, listeners[listenType]);
		privateRepository.addEventListener(listenType, listeners[listenType]);
	}
	this.setMap = function (mapInfo) {
		listeners.mapLoaded(mapInfo);
	};
	this.loadMap = function (mapId) {
		if (privateRepository.recognises && privateRepository.recognises(mapId)) {
			usePrivateRepository(
				function () {
					privateRepository.loadMap(mapId);
				},
				function () {
					privateRepository.loadPublicMap(mapId);
				}
			);
		} else {
			publicrepository.loadMap(mapId);
		}
	};

	this.publishMap = function (repository) {
		if (privateRepository.recognises && (
				(!repository && privateRepository.recognises(mapInfo.mapId))
				||
				privateRepository.recognises(repository)
			)) {
			privateRepository.saveMap(mapInfo);
		} else {
			publicrepository.saveMap(mapInfo);
		}
	};

	this.saveAs = function (title) {
		usePrivateRepository(
			function () {
				privateRepository.saveMap({idea: mapInfo.idea, title: title});
			},
			function () {
				dispatchEvent('saveAsFailed', 'private repository not ready');
			}
		);
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
	var changed, saving, mapLoaded,
		toggleChange = function () {
			saving = false;
			if (!changed) {
				jQuery('#toolbarShare').hide();
				jQuery('#toolbarSave').show();
				jQuery('#menuExport').hide();
				jQuery('#menuPublish').effect('highlight');
				activityLog.log('Map', 'Edit');
				changed = true;
			}
		};
	mapRepository.addEventListener('mapLoaded', function (idea) {
		if (!mapLoaded) {
			jQuery(window).bind('beforeunload', function () {
				if (changed && !saving) {
					return 'There are unsaved changes.';
				}
			});
			mapLoaded = true;
		} else {
			toggleChange();
		}
		idea.addEventListener('changed', function (command, args) {
			toggleChange();
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

	mapRepository.addEventListener('mapSaved', function () {
		saving = false;
		changed = false;
		jQuery('#toolbarShare').show();
		jQuery('#toolbarSave').hide();
		jQuery('#menuExport').show();
		jQuery('#menuPublish').hide();
	});
};
