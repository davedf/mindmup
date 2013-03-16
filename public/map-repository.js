/*jslint forin: true nomen: true, plusplus: true*/
/*global _, content, jQuery, MM, observable, setTimeout, window, document*/
MM.MapRepository = function (activityLog, alert, repositories) {
	// order of repositories is important, the first repository is default
	'use strict';
	observable(this);
	var dispatchEvent = this.dispatchEvent,
		mapInfo = {},
		addListeners = function (repository) {
			//Remove this once s3 repository is not redirecting after save
			if (repository.addEventListener) {
				MM.MapRepository.alerts(repository, alert);
				repository.addEventListener('mapSaved', function (key, idea) {
					dispatchEvent('mapSaved', key, idea);
					dispatchEvent('mapSaveCompleted', repository.description);
				});
				repository.addEventListener('networkError', function (err) {
					dispatchEvent('networkError', err);
				});
			}
		},
		chooseRepository = function (identifiers) {
			// order of identifiers is important, the first identifier takes precedence
			var idIndex, repoIndex;
			for (idIndex = 0; idIndex < identifiers.length; idIndex++) {
				for (repoIndex = 0; repoIndex < repositories.length; repoIndex++) {
					if (repositories[repoIndex].recognises(identifiers[idIndex])) {
						return repositories[repoIndex];
					}
				}
			}
			return repositories[0];
		},
		mapLoaded = function (newMapInfo) {
			mapInfo = _.clone(newMapInfo);
			dispatchEvent('mapLoaded', newMapInfo.idea, newMapInfo.mapId);
		};
	MM.MapRepository.mapLocationChange(this);
	MM.MapRepository.activityTracking(this, activityLog);

	MM.MapRepository.alerts(this, alert);
	MM.MapRepository.toolbarAndUnsavedChangesDialogue(this, activityLog);
	_.each(repositories, addListeners);

	this.setMap = mapLoaded;

	this.loadMap = function (mapId) {
		var repository = chooseRepository([mapId]),
			mapLoadFailed = function (reason) {
				var retryWithDialog = function () {
					dispatchEvent('mapLoading', mapId);
					repository.loadMap(mapId, true).then(mapLoaded, mapLoadFailed);
				};
				if (reason === 'no-access-allowed') {
					dispatchEvent('mapLoadingUnAuthorized', mapId, reason);
				} else if (reason === 'failed-authentication') {
					dispatchEvent('authorisationFailed', repository.description, retryWithDialog);
				} else if (reason === 'not-authenticated') {
					dispatchEvent('authRequired', repository.description, retryWithDialog);
				} else {
					dispatchEvent('mapLoadingFailed', mapId, reason);
				}
			};
		dispatchEvent('mapLoading', mapId);
		repository.loadMap(mapId).then(mapLoaded, mapLoadFailed);
	};

	this.publishMap = function (repositoryType) {
		var repository = chooseRepository([repositoryType, mapInfo.mapId]),
			mapSaved = function (savedMapInfo) {
				dispatchEvent('mapSaved', savedMapInfo.mapId, savedMapInfo.idea, (mapInfo.mapId !== savedMapInfo.mapId));
				dispatchEvent('mapSaveCompleted', repository.description);
				mapInfo = savedMapInfo;
			},
			mapSaveFailed = function (reason) {
				var retryWithDialog = function () {
					dispatchEvent('mapSaving', repository.description);
					repository.saveMap(_.clone(mapInfo), true).then(mapSaved, mapSaveFailed);
				};
				if (reason === 'no-access-allowed') {
					dispatchEvent('mapSavingUnAuthorized', function () {
						dispatchEvent('mapSaving');
						var saveAsNewInfo = _.clone(mapInfo);
						saveAsNewInfo.mapId = 'new';
						repository.saveMap(saveAsNewInfo, true).then(mapSaved, mapSaveFailed);
					});
				} else if (reason === 'failed-authentication') {
					dispatchEvent('authorisationFailed', repository.description, retryWithDialog);
				} else if (reason === 'not-authenticated') {
					dispatchEvent('authRequired', repository.description, retryWithDialog);
				} else {
					dispatchEvent('mapSavingFailed', reason, repository.description);
				}
			};
		dispatchEvent('mapSaving', repository.description);
		repository.saveMap(_.clone(mapInfo)).then(mapSaved, mapSaveFailed);
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
		activityLog.error('Error loading map document [' + mapUrl + '] ' + JSON.stringify(reason));
	});
	mapRepository.addEventListener('mapSaving', activityLog.log.bind(activityLog, 'Map', 'Save Attempted'));
	mapRepository.addEventListener('mapSaveCompleted', activityLog.log.bind(activityLog, 'Map', 'Save Completed'));
	mapRepository.addEventListener('mapSaved', function (id, idea) {
		if (isMapRelevant(idea) && !wasRelevantOnLoad) {
			activityLog.log('Map', 'Created Relevant', id);
		} else if (wasRelevantOnLoad) {
			activityLog.log('Map', 'Saved Relevant', id);
		} else {
			activityLog.log('Map', 'Saved Irrelevant', id);
		}
	});
	mapRepository.addEventListener('mapSavingFailed', function (reason, repositoryName) {
		activityLog.error('Map save failed (' + repositoryName + ')' + JSON.stringify(reason));
	});
	mapRepository.addEventListener('networkError', function (reason) {
		activityLog.log('Map', 'networkError', JSON.stringify(reason));
	});
};
MM.MapRepository.alerts = function (mapRepository, alert) {
	'use strict';
	var alertId,
		showAlertWithCallBack = function (message, prompt, type, callback) {
			alert.hide(alertId);
			alertId = alert.show(
				message,
				'<a href="#" data-mm-role="auth">' + prompt + '</a>',
				type
			);
			jQuery('[data-mm-role=auth]').click(function () {
				alert.hide(alertId);
				callback();
			});
		},
		showErrorAlert = function (title, message) {
			alert.hide(alertId);
			alertId = alert.show(title, message, 'error');
		};
	mapRepository.addEventListener('mapLoading', function () {
		alertId = alert.show('Please wait, loading the map...', '<i class="icon-spinner icon-spin"></i>');
	});
	mapRepository.addEventListener('authRequired', function (providerName, authCallback) {
		showAlertWithCallBack(
			'This operation requires authentication through ' + providerName + ' !',
			'Click here to authenticate',
			'warning',
			authCallback
		);
	});
	mapRepository.addEventListener('mapLoaded', function () {
		alert.hide(alertId);
	});
	mapRepository.addEventListener('authorisationFailed', function (providerName, authCallback) {
		showAlertWithCallBack(
			'We were unable to authenticate with ' + providerName,
			'Click here to try again',
			'warning',
			authCallback
		);
	});
	mapRepository.addEventListener('mapLoadingUnAuthorized', function () {
		showErrorAlert('The map could not be loaded.', 'You do not have the right to view this map');
	});
	mapRepository.addEventListener('mapSavingUnAuthorized', function (callback) {
		showAlertWithCallBack(
			'You do not have the right to edit this map',
			'Click here to save a copy',
			'error',
			callback
		);
	});
	mapRepository.addEventListener('mapLoadingFailed', function (mapUrl, reason) {
		showErrorAlert('Unfortunately, there was a problem loading the map.', 'An automated error report was sent and we will look into this as soon as possible');
	});
	mapRepository.addEventListener('mapSavingFailed', function () {
		showErrorAlert('Unfortunately, there was a problem saving the map.', 'Please try again later. We have sent an error report and we will look into this as soon as possible');
	});
};
MM.MapRepository.toolbarAndUnsavedChangesDialogue = function (mapRepository, activityLog) {
	'use strict';
	var changed, saving, mapLoaded,
		toggleChange = function () {
			saving = false;
			if (!changed) {
				jQuery('body').removeClass('map-unchanged').addClass('map-changed');
				activityLog.log('Map', 'Edit');
				changed = true;
			}
		};
	mapRepository.addEventListener('mapLoaded', function (idea, mapId) {
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
		if (mapId.length < 3) { /* imported, no repository ID */
			toggleChange();
		}
		idea.addEventListener('changed', function (command, args) {
			toggleChange();
			activityLog.log(['Map', command].concat(args));
		});
	});
	mapRepository.addEventListener('mapSaving', function () {
		saving = true;
	});
	mapRepository.addEventListener('mapSaved', function () {
		saving = false;
		changed = false;
		jQuery('body').removeClass('map-changed').addClass('map-unchanged');
	});
};
MM.MapRepository.mapLocationChange = function (mapRepository) {
	'use strict';
	mapRepository.addEventListener('mapSaved', function (newMapId, idea, idHasChanged) {
		if (idHasChanged) {
			document.location = "/map/" + newMapId;
		}
	});
};
