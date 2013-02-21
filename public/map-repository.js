/*global content, jQuery, MM, observable, setTimeout, window */
MM.MapRepository = function (activityLog, alert, networkTimeoutMillis) {
	'use strict';
	observable(this);
	var dispatchEvent = this.dispatchEvent, idea;
	MM.MapRepository.activityTracking(this, activityLog);
	MM.MapRepository.alerts(this, alert);
	MM.MapRepository.toolbarAndUnsavedChangesDialogue(this, activityLog);
	this.setMap = function (jsonContent) {
		idea = content(jsonContent);
		dispatchEvent('mapLoaded', idea, idea.id);
	};
	this.loadMap = function (mapUrl, mapId) {
		var repository = this,
			onMapLoaded = function (result) {
				repository.setMap(result);
			},
			onMapLoadingFailed = function (xhr, textStatus, errorMsg) {
				dispatchEvent('mapLoadingFailed', mapUrl, 'status=' + textStatus + ' error msg=' + errorMsg);
			},
			loadMapUsingProxy = function () {
				activityLog.log('Map', 'ProxyLoad', mapId);
				jQuery.ajax(
					'/s3proxy/' + mapId,
					{ dataType: 'json', success: onMapLoaded, error: onMapLoadingFailed }
				);
			};
		dispatchEvent('mapLoading', mapUrl, mapId);
		jQuery.ajax(
			mapUrl,
			{ dataType: 'json', success: onMapLoaded, error: loadMapUsingProxy }
		);
	};
	this.publishMap = function () {
		dispatchEvent('mapSaving');
		var publishing = true,
			saveTimeoutOccurred = function () {
				publishing = false;
				dispatchEvent('mapSavingFailed');
			},
			submitS3Form = function (result) {
				var name;
				publishing = false;
				jQuery('#s3form [name="file"]').val(JSON.stringify(idea));
				for (name in result) {
					jQuery('#s3form [name=' + name + ']').val(result[name]);
				}
				dispatchEvent('Before Upload', result.s3UploadIdentifier, idea);
				jQuery('#s3form').submit();
			},
			fetchPublishingConfig = function () {
				activityLog.log('Fetching publishing config');
				jQuery.ajax(
					'/publishingConfig',
					{
						dataType: 'json',
						cache: false,
						success: submitS3Form,
						error: function (result) {
							if (publishing) {
								setTimeout(fetchPublishingConfig, 1000);
							}
						}
					}
				);
			};
		setTimeout(saveTimeoutOccurred, networkTimeoutMillis);
		fetchPublishingConfig();
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
	var changed, saving, boundToMap,
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
		if (!boundToMap) {
			jQuery(window).bind('beforeunload', function () {
				if (changed && !saving) {
					return 'There are unsaved changes.';
				}
			});
			boundToMap = true;
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
};
