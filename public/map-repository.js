/*global _, content, jQuery, MM, observable, window, document, setTimeout*/
MM.MapRepository = function (activityLog, alert, repositories) {
	// order of repositories is important, the first repository is default
	'use strict';
	observable(this);
	var dispatchEvent = this.dispatchEvent,
		mapInfo = {},
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
		setMap = function (idea, mapId) {
			mapInfo = {
				idea: idea,
				mapId: mapId
			};
			dispatchEvent('mapLoaded', idea, mapId);
		},
		mapLoaded = function (fileContent, mapId, mimeType) {
			var json, idea;
			if (mimeType === 'application/json') {
				json = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;
			} else if (mimeType === 'application/octet-stream') {
				json = JSON.parse(fileContent);
			} else if (mimeType === 'application/x-freemind') {
				json = MM.freemindImport(fileContent);
			}
			idea = content(json);
			setMap(idea, mapId);
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
		var timeout,
			repository = chooseRepository([mapId]),
			progressEvent = function (evt) {
				var done = (evt && evt.loaded) || 0,
					total = (evt && evt.total) || 1,
					message = ((evt && evt.loaded) ? Math.round(100 * done / total) + "%" : evt);
				dispatchEvent('mapLoading', mapId, message);
			},
			mapLoadFailed = function (reason, label) {
				var retryWithDialog = function () {
					dispatchEvent('mapLoading', mapId);
					repository.loadMap(mapId, true).then(mapLoaded, mapLoadFailed).progress(progressEvent);
				}, repositoryName = repository.description ? ' [' + repository.description + ']' : '';
				label = label ? label + repositoryName : repositoryName;
				if (reason === 'no-access-allowed') {
					dispatchEvent('mapLoadingUnAuthorized', mapId, reason);
				} else if (reason === 'failed-authentication') {
					dispatchEvent('authorisationFailed', repository.description, retryWithDialog);
				} else if (reason === 'not-authenticated') {
					dispatchEvent('authRequired', repository.description, retryWithDialog);
				} else {
					dispatchEvent('mapLoadingFailed', mapId, reason, label);
				}
			};
		dispatchEvent('mapLoading', mapId);
		MM.retry(
			repository.loadMap.bind(repository, mapId),
			shouldRetry(5),
			MM.linearBackoff()
		).then(
			mapLoaded,
			mapLoadFailed
		).progress(progressEvent);
	};

	this.publishMap = function (repositoryType) {
		var repository = chooseRepository([repositoryType, mapInfo.mapId]),
			mapSaved = function (savedMapInfo) {
				dispatchEvent('mapSaved', savedMapInfo.mapId, savedMapInfo.idea, (mapInfo.mapId !== savedMapInfo.mapId));
				mapInfo = savedMapInfo;
			},
			progressEvent = function (evt) {
				var done = (evt && evt.loaded) || 0,
					total = (evt && evt.total) || 1,
					message = ((evt && evt.loaded) ? Math.round(100 * done / total) + "%" : evt);
				dispatchEvent('mapSaving', repository.description, message);
			},
			mapSaveFailed = function (reason, label) {
				var retryWithDialog = function () {
					dispatchEvent('mapSaving', repository.description);
					repository.saveMap(_.clone(mapInfo), true).then(mapSaved, mapSaveFailed).progress(progressEvent);
				}, repositoryName = repository.description || '';
				label = label ? label + repositoryName : repositoryName;
				if (reason === 'no-access-allowed') {
					dispatchEvent('mapSavingUnAuthorized', function () {
						dispatchEvent('mapSaving', repository.description, 'Creating a new file');
						var saveAsNewInfo = _.clone(mapInfo);
						saveAsNewInfo.mapId = 'new';
						repository.saveMap(saveAsNewInfo, true).then(mapSaved, mapSaveFailed).progress(progressEvent);
					});
				} else if (reason === 'failed-authentication') {
					dispatchEvent('authorisationFailed', label, retryWithDialog);
				} else if (reason === 'not-authenticated') {
					dispatchEvent('authRequired', label, retryWithDialog);
				} else {
					dispatchEvent('mapSavingFailed', reason, label);
				}
			};
		dispatchEvent('mapSaving', repository.description);
		MM.retry(repository.saveMap.bind(repository, _.clone(mapInfo)), shouldRetry(5), MM.linearBackoff()).then(mapSaved, mapSaveFailed).progress(progressEvent);
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
	mapRepository.addEventListener('mapSavingFailed', function (reason) {
		var messages = {
			'file-too-large': ['Unfortunately, the file is too large for the selected storage provider.', 'Please select a different storage provider from the save dropdown menu'],
			'network-error': ['There was a problem communicating with the server.', 'Please try again later, or select a different storage provider from the save dropdown menu']
		},
			message = messages[reason] || ['Unfortunately, there was a problem saving the map.', 'Please try again later. We have sent an error report and we will look into this as soon as possible'];

		showErrorAlert(message[0], message[1]);
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
		jQuery('body').removeClass('map-changed').addClass('map-unchanged');
		changed = false;
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

(function ($, window) {
	'use strict';
    //patch ajax settings to call a progress callback
    var oldXHR = $.ajaxSettings.xhr;
    $.ajaxSettings.xhr = function () {
        var xhr = oldXHR();
        if (xhr instanceof window.XMLHttpRequest) {
            xhr.addEventListener('progress', this.progress, false);
        }
        if (xhr.upload) {
            xhr.upload.addEventListener('progress', this.progress, false);
        }
        return xhr;
    };
}(jQuery, window));
