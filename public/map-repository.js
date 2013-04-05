/*global _, jQuery, MAPJS, MM, observable, window, document, setTimeout*/
MM.MapRepository = function (activityLog, alert, adapters) {
	// order of adapters is important, the first adapter is default
	'use strict';
	observable(this);
	var jsonMimeType = 'application/json',
		dispatchEvent = this.dispatchEvent,
		mapInfo = {},
		offlineFallback = new MM.OfflineFallback(MM.jsonStorage(localStorage)),
		chooseAdapter = function (identifiers) {
			// order of identifiers is important, the first identifier takes precedence
			var idIndex, adapterIndex;
			for (idIndex = 0; idIndex < identifiers.length; idIndex++) {
				for (adapterIndex = 0; adapterIndex < adapters.length; adapterIndex++) {
					if (adapters[adapterIndex].recognises(identifiers[idIndex])) {
						return adapters[adapterIndex];
					}
				}
			}
			return adapters[0];
		},
		setMap = function (idea, mapId, notSharable) {
			mapInfo = {
				idea: idea,
				mapId: mapId
			};
			dispatchEvent('mapLoaded', idea, mapId, notSharable);
		},
		mapLoaded = function (fileContent, mapId, mimeType, notSharable) {
			var json, idea;
			if (mimeType === jsonMimeType) {
				json = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;
			} else if (mimeType === 'application/octet-stream') {
				json = JSON.parse(fileContent);
			} else if (mimeType === 'application/x-freemind') {
				json = MM.freemindImport(fileContent);
			}
			idea = MAPJS.content(json);
			setMap(idea, mapId, notSharable);
		},
		shouldRetry = function (retries) {
			var times = MM.retryTimes(retries);
			return function (status) {
				return times() && status === 'network-error';
			};
		};

	MM.MapRepository.mapLocationChange(this);
	MM.MapRepository.activityTracking(this, activityLog);
	MM.MapRepository.alerts(this, alert);
	MM.MapRepository.toolbarAndUnsavedChangesDialogue(this, activityLog);

	this.setMap = setMap;

	this.loadMap = function (mapId) {
		var adapter = chooseAdapter([mapId]),
			progressEvent = function (evt) {
				var done = (evt && evt.loaded) || 0,
					total = (evt && evt.total) || 1,
					message = ((evt && evt.loaded) ? Math.round(100 * done / total) + '%' : evt);
				dispatchEvent('mapLoading', mapId, message);
			},
			adapterLoadedMap = function (fileContent, mapId, mimeType) {
				mapLoaded(fileContent, mapId, mimeType, adapter.notSharable);
			},
			mapLoadFailed = function (reason, label) {
				var retryWithDialog = function () {
					dispatchEvent('mapLoading', mapId);
					adapter.loadMap(mapId, true).then(adapterLoadedMap, mapLoadFailed).progress(progressEvent);
				}, adapterName = adapter.description ? ' [' + adapter.description + ']' : '';
				label = label ? label + adapterName : adapterName;
				if (reason === 'no-access-allowed') {
					dispatchEvent('mapLoadingUnAuthorized', mapId, reason);
				} else if (reason === 'failed-authentication') {
					dispatchEvent('authorisationFailed', adapter.description, retryWithDialog);
				} else if (reason === 'not-authenticated') {
					dispatchEvent('authRequired', adapter.description, retryWithDialog);
				} else {
					dispatchEvent('mapLoadingFailed', mapId, reason, label);
				}
			},
			offlineFallbackMap,
			loadFromAdapter = function () {
				offlineFallback.remove(mapId);
				var embeddedMap = MM && MM.Maps && mapId && MM.Maps[mapId.toLowerCase()];
				if (embeddedMap) {
					mapLoaded(embeddedMap, mapId, jsonMimeType, true);
				} else {
					MM.retry(
						adapter.loadMap.bind(adapter, mapId),
						shouldRetry(5),
						MM.linearBackoff()
					).then(
						adapterLoadedMap,
						mapLoadFailed
					).progress(progressEvent);
				}
			};
		dispatchEvent('mapLoading', mapId);
		offlineFallbackMap = offlineFallback.loadMap(mapId);

		if (offlineFallbackMap) {
			dispatchEvent('offlineFallbackExists', mapLoaded.bind(undefined, offlineFallbackMap, mapId, jsonMimeType, true), loadFromAdapter);
		} else {
			loadFromAdapter();
		}
	};

	this.publishMap = function (adapterType) {
		var adapter = chooseAdapter([adapterType, mapInfo.mapId]),
			mapSaved = function (savedMapInfo) {
				offlineFallback.remove(mapInfo.mapId);
				dispatchEvent('mapSaved', savedMapInfo.mapId, savedMapInfo.idea, (mapInfo.mapId !== savedMapInfo.mapId));
				mapInfo = savedMapInfo;
			},
			progressEvent = function (evt) {
				var done = (evt && evt.loaded) || 0,
					total = (evt && evt.total) || 1,
					message = ((evt && evt.loaded) ? Math.round(100 * done / total) + '%' : evt);
				dispatchEvent('mapSaving', adapter.description, message);
			},
			mapSaveFailed = function (reason, label) {
				var retryWithDialog = function () {
					dispatchEvent('mapSaving', adapter.description);
					adapter.saveMap(_.clone(mapInfo), true).then(mapSaved, mapSaveFailed).progress(progressEvent);
				}, adapterName = adapter.description || '';
				label = label ? label + adapterName : adapterName;
				if (reason === 'no-access-allowed') {
					dispatchEvent('mapSavingUnAuthorized', function () {
						dispatchEvent('mapSaving', adapter.description, 'Creating a new file');
						var saveAsNewInfo = _.clone(mapInfo);
						saveAsNewInfo.mapId = 'new';
						adapter.saveMap(saveAsNewInfo, true).then(mapSaved, mapSaveFailed).progress(progressEvent);
					});
				} else if (reason === 'failed-authentication') {
					dispatchEvent('authorisationFailed', label, retryWithDialog);
				} else if (reason === 'not-authenticated') {
					dispatchEvent('authRequired', label, retryWithDialog);
				} else if (reason === 'network-error') {
					dispatchEvent('mapSavingFailed', reason, label, function () {
						try {
							offlineFallback.saveMap(mapInfo.mapId, mapInfo.idea);
							dispatchEvent('mapSaved', mapInfo.mapId, mapInfo.idea, false);
						} catch (e) {
							dispatchEvent('mapSavingFailed', 'local-storage-failed', e.toString());
						}
					});
				} else {
					dispatchEvent('mapSavingFailed', reason, label);
				}
			},
			fallbackMap = offlineFallback.loadMap(mapInfo.mapId);
		dispatchEvent('mapSaving', adapter.description);
		MM.retry(adapter.saveMap.bind(adapter, _.clone(mapInfo)), shouldRetry(fallbackMap ? 0 : 5), MM.linearBackoff()).then(mapSaved, mapSaveFailed).progress(progressEvent);
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
	mapRepository.addEventListener('mapLoading', function (mapUrl, percentDone) {
		activityLog.log('loading map [' + mapUrl + '] (' + percentDone + '%)');
	});
	mapRepository.addEventListener('mapLoaded', function (idea, mapId) {
		activityLog.log('Map', 'View', mapId);
		wasRelevantOnLoad = isMapRelevant(idea);
	});
	mapRepository.addEventListener('mapLoadingFailed', function (mapUrl, reason, label) {
		var message = 'Error loading map document [' + mapUrl + '] ' + JSON.stringify(reason);
		if (label) {
			message = message + ' label [' + label + ']';
		}
		activityLog.error(message);
	});
	mapRepository.addEventListener('mapSaving', activityLog.log.bind(activityLog, 'Map', 'Save Attempted'));
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
	mapRepository.addEventListener('mapLoading', function (mapUrl, progressMessage) {
		alert.hide(alertId);
		alertId = alert.show('<i class="icon-spinner icon-spin"></i>&nbsp;Please wait, loading the map...', (progressMessage || ''));
	});
	mapRepository.addEventListener('mapSaving', function (repositoryName, progressMessage) {
		alert.hide(alertId);
		alertId = alert.show('<i class="icon-spinner icon-spin"></i>&nbsp;Please wait, saving the map...', (progressMessage || ''));
	});
	mapRepository.addEventListener('authRequired', function (providerName, authCallback) {
		showAlertWithCallBack(
			'This operation requires authentication through ' + providerName + ' !',
			'Click here to authenticate',
			'warning',
			authCallback
		);
	});
	mapRepository.addEventListener('mapSaved', function () {
		alert.hide(alertId);
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
	mapRepository.addEventListener('mapLoadingFailed', function () {
		showErrorAlert('Unfortunately, there was a problem loading the map.', 'An automated error report was sent and we will look into this as soon as possible');
	});
	mapRepository.addEventListener('mapSavingFailed', function (reason, label, callback) {
		var messages = {
			'file-too-large': ['Unfortunately, the file is too large for the selected storage provider.', 'Please select a different storage provider from the save dropdown menu'],
			'network-error': ['There was a problem communicating with the server.', 'Click here to save a back-up copy locally in your browser'],
			'local-storage-failed': ['There was a problem saving to local storage.', 'Not enough space']
		},
			message = messages[reason] || ['Unfortunately, there was a problem saving the map.', 'Please try again later. We have sent an error report and we will look into this as soon as possible'];
		if (callback) {
			showAlertWithCallBack(message[0], message[1], 'warning', callback);
		} else {
			showErrorAlert(message[0], message[1]);
		}
	});
	mapRepository.addEventListener('offlineFallbackExists', function (useLocalStorageCallback, useAdapterCallback) {
		alert.hide(alertId);
		alertId = alert.show(
			'You saved a back-up copy of this map locally in your browser!',
			'<a href="#" data-mm-role="localStorage">Click here to load from local back-up</a> or <a href="#" data-mm-role="adapterStorage">Click here to discard the local backup and load from the cloud</a>',
			'warning'
		);
		jQuery('[data-mm-role=localStorage]').click(function () {
			alert.hide(alertId);
			useLocalStorageCallback();
		});
		jQuery('[data-mm-role=adapterStorage]').click(function () {
			alert.hide(alertId);
			useAdapterCallback();
		});
	});
};
MM.MapRepository.toolbarAndUnsavedChangesDialogue = function (mapRepository, activityLog) {
	'use strict';
	var changed, saving, mapLoaded,
		setNotSharable = function (notSharable) {
			if (notSharable) {
				jQuery('body').removeClass('map-sharable').addClass('map-not-sharable');
			} else {
				jQuery('body').removeClass('map-not-sharable').addClass('map-sharable');
			}
		},
		toggleChange = function () {
			saving = false;
			if (!changed) {
				jQuery('body').removeClass('map-unchanged').addClass('map-changed');
				activityLog.log('Map', 'Edit');
				changed = true;
			}
		};
	mapRepository.addEventListener('mapLoaded', function (idea, mapId, notSharable) {
		jQuery('body').removeClass('map-changed').addClass('map-unchanged');
		changed = false;
		setNotSharable(notSharable);
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
		if (!mapId || mapId.length < 3) { /* imported, no repository ID */
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
			document.location = '/map/' + newMapId;
		}
	});
};

MM.retry = function (task, shouldRetry, backoff) {
	'use strict';
	var deferred = jQuery.Deferred(),
		attemptTask = function () {
			task().then(
				deferred.resolve,
				function () {
					if (!shouldRetry || shouldRetry.apply(undefined, arguments)) {
						deferred.notify('Network problem... Will retry shortly');
						if (backoff) {
							setTimeout(attemptTask, backoff());
						} else {
							attemptTask();
						}
					} else {
						deferred.reject.apply(deferred, arguments);
					}
				}
			).progress(
				deferred.notify
			);
		};
	attemptTask();
	return deferred.promise();
};
MM.retryTimes = function (retries) {
	'use strict';
	return function () {
		return retries--;
	};
};
MM.linearBackoff = function () {
	'use strict';
	var calls = 0;
	return function () {
		calls++;
		return 1000 * calls;
	};
};

(function () {
	'use strict';
	var oldXHR = jQuery.ajaxSettings.xhr;
	jQuery.ajaxSettings.xhr = function () {
		var xhr = oldXHR();
		if (xhr instanceof XMLHttpRequest) {
			xhr.addEventListener('progress', this.progress, false);
		}
		if (xhr.upload) {
			xhr.upload.addEventListener('progress', this.progress, false);
		}
		return xhr;
	};
}());
