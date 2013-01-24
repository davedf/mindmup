/*global $, setTimeout, jQuery, content, window, document, MM*/
MM.MapRepository = function (activityLog, feedback, alert) {
	'use strict';
	/* documentation map doesn't have ID=1, so anything with ID=1 was created as a new map */
	var active_content,
		wasRelevantOnLoad,
		changed,
		saving,
		startedFromNew = function (contentAggregate) {
			return contentAggregate.id === 1;
		},
		isNodeRelevant = function (ideaNode) {
			return ideaNode.title && ideaNode.title.search(/MindMup|Lancelot|cunning|brilliant|Press Space|famous/) === -1;
		},
		isNodeIrrelevant = function (ideaNode) {
			return !isNodeRelevant(ideaNode);
		},
		isMapRelevant = function (contentAggregate) {
			return startedFromNew(contentAggregate) &&
				contentAggregate.find(isNodeRelevant).length > 5 &&
				contentAggregate.find(isNodeIrrelevant).length < 3;
		};
	this.loadMap = function (map_url, mapId, load_content) {
		activityLog.log("loading map [" + map_url + "]");
		var alertId = alert.show('Please wait, loading the map...', '<i class="icon-spinner icon-spin"></i>'),
			jsonLoadSuccess = function (result, status) {
				alert.hide(alertId);
				active_content = content(result);
				wasRelevantOnLoad = isMapRelevant(active_content);
				activityLog.log("loaded JSON map document");
				$(window).bind('beforeunload', function () {
					if (changed && !saving) {
						return 'There are unsaved changes.';
					}
				});
				active_content.addEventListener('changed', function (arg1, arg2) {
					saving = false;
					if (!changed) {
						$("#toolbarShare").hide();
						$("#toolbarSave").show();
						$('#menuPublish').effect('highlight');
						activityLog.log('Map', 'Edit');
						changed = true;
					}
					activityLog.log([arg1, arg2]);
				});
				//logMapActivity('View', mapId);
				document.title = active_content.title;
				$('.st_btn').attr('st_title', active_content.title);
				$('#map_title').text(active_content.title);
				load_content(active_content);
			},
			jsonFail = function (xhr, textStatus, errorMsg) {
				var msg = "Error loading map document [" + map_url + "] status=" + textStatus + " error msg= " + errorMsg;
				activityLog.log(msg);
				alert.hide(alertId);
				alert.show(
					'Unfortunately, there was a problem loading the map.',
					'An automated error report was sent and we will look into this as soon as possible',
					'error'
				);
				feedback.sendErrorReport(msg);
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
				MM.sendErrorReport('Map save failed');
			},
			submitS3Form = function (result) {
				var name,
					relevant = isMapRelevant(active_content);
				publishing = false;
				if (relevant && !wasRelevantOnLoad) {
					activityLog.log('Map', 'Created Relevant', result.key);
				} else if (wasRelevantOnLoad) {
					activityLog.log('Map', 'Saved Relevant', result.key);
				} else {
					activityLog.log('Map', 'Saved Irrelevant', result.key);
				}
				$("#s3form [name='file']").val(JSON.stringify(active_content));
				for (name in result) {
					$('#s3form [name=' + name + ']').val(result[name]);
				}
				saving = true;
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
		setTimeout(saveTimeoutOccurred, parseInt(jQuery('#container').attr('network_timeout_millis'), 10));
		fetchPublishingConfig();
	};
};
