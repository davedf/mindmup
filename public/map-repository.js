/*global $, setTimeout, jQuery, content, window, document, observable, MM*/
MM.MapRepository = function (activityLog, alert, networkTimeoutMillis) {
	'use strict';
	/* documentation map doesn't have ID=1, so anything with ID=1 was created as a new map */
	var self = this,
		idea,
		wasRelevantOnLoad,
		changed,
		saving,
		startedFromNew = function () {
			return idea.id === 1;
		},
		isNodeRelevant = function (ideaNode) {
			return ideaNode.title && ideaNode.title.search(/MindMup|Lancelot|cunning|brilliant|Press Space|famous|Luke|daddy/) === -1;
		},
		isNodeIrrelevant = function (ideaNode) {
			return !isNodeRelevant(ideaNode);
		},
		isMapRelevant = function () {
			return startedFromNew() && idea.find(isNodeRelevant).length > 5 && idea.find(isNodeIrrelevant).length < 3;
		};
	observable(this);
	this.loadMap = function (map_url, mapId) {
		activityLog.log("loading map [" + map_url + "]");
		var alertId = alert.show('Please wait, loading the map...', '<i class="icon-spinner icon-spin"></i>'),
			jsonLoadSuccess = function (result) {
				alert.hide(alertId);
				idea = content(result);
				wasRelevantOnLoad = isMapRelevant();
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
				activityLog.error("Error loading map document [" + map_url + "] status=" + textStatus + " error msg= " + errorMsg);
				alert.hide(alertId);
				alert.show(
					'Unfortunately, there was a problem loading the map.',
					'An automated error report was sent and we will look into this as soon as possible',
					'error'
				);
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
				alert.show(
					'Unfortunately, there was a problem saving the map.',
					'Please try again later. We have sent an error report and we will look into this as soon as possible',
					'error'
				);
				activityLog.error('Map save failed');
			},
			submitS3Form = function (result) {
				var name;
				publishing = false;
				if (isMapRelevant() && !wasRelevantOnLoad) {
					activityLog.log('Map', 'Created Relevant', result.s3UploadIdentifier);
				} else if (wasRelevantOnLoad) {
					activityLog.log('Map', 'Saved Relevant', result.s3UploadIdentifier);
				} else {
					activityLog.log('Map', 'Saved Irrelevant', result.s3UploadIdentifier);
				}
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
