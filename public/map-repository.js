/*global $, setTimeout, jQuery, content, window, document, observable, MM*/
MM.MapRepository = function (activityLog, alert, networkTimeoutMillis) {
	'use strict';
	var self = this, idea, changed, saving;
	observable(this);
	MM.relevantMapTracker(this, activityLog);
	MM.todoAlertManagement(this, alert);
	this.loadMap = function (map_url, mapId) {
		self.dispatchEvent('mapLoading', map_url, mapId);
		activityLog.log("loading map [" + map_url + "]");
		var jsonLoadSuccess = function (result) {
				idea = content(result);
				activityLog.log("loaded JSON map document");
				$(window).bind('beforeunload', function () {
					if (changed && !saving) {
						return 'There are unsaved changes.';
					}
				});
				idea.addEventListener('changed', function (command, args) {
					saving = false;
					if (!changed) {
						$("#toolbarShare").hide();
						$("#toolbarSave").show();
						$("#menuExport").hide();
						$('#menuPublish').effect('highlight');
						activityLog.log('Map', 'Edit');
						changed = true;
					}
					activityLog.log(['Map', command].concat(args));
				});
				activityLog.log('Map', 'View', mapId);
				self.dispatchEvent('mapLoaded', idea);
			},
			jsonFail = function (xhr, textStatus, errorMsg) {
				self.dispatchEvent('mapLoadingFailed');
				activityLog.error("Error loading map document [" + map_url + "] status=" + textStatus + " error msg= " + errorMsg);
			},
			jsonTryProxy = function (map_url) {
				activityLog.log('Map', 'ProxyLoad', mapId);
				$.ajax(
					'/s3proxy/' + mapId,
					{ dataType: 'json', success: jsonLoadSuccess, error: jsonFail }
				);
			};
		$.ajax(
			map_url,
			{ dataType: 'json', success: jsonLoadSuccess, error: jsonTryProxy }
		);
	};
	this.publishMap = function () {
		saving = true;
		var publishing = true,
			saveTimeoutOccurred = function () {
				publishing = false;
				$('#menuPublish').text('Save').addClass('btn-primary').attr("disabled", false);
				$('#toolbarSave p').show();
				self.dispatchEvent('mapSavingFailed');
				activityLog.error('Map save failed');
			},
			submitS3Form = function (result) {
				var name;
				publishing = false;
				$("#s3form [name='file']").val(JSON.stringify(idea));
				for (name in result) {
					$('#s3form [name=' + name + ']').val(result[name]);
				}
				saving = true;
				self.dispatchEvent('Before Upload', result.s3UploadIdentifier, idea);
				$('#s3form').submit();
			},
			fetchPublishingConfig = function () {
				activityLog.log('Fetching publishing config');
				$.ajax(
					"/publishingConfig",
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
MM.relevantMapTracker = function (mapRepository, activityLog) {
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
	mapRepository.addEventListener('mapLoaded', function (idea) {
		wasRelevantOnLoad = isMapRelevant(idea);
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
};
MM.todoAlertManagement = function (mapRepository, alert) {
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
