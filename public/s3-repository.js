/*jslint forin: true*/
/*global content, jQuery, MM, observable, setTimeout, window */
MM.S3MapRepository = function (s3Url, activityLog, networkTimeoutMillis) {
	'use strict';
	observable(this);
	var dispatchEvent = this.dispatchEvent;

	this.recognises = function (mapId) {
		return mapId && mapId[0] === "a";
	};

	this.use = function (doThis) {
		doThis();
	};

	this.loadMap = function (mapId) {
		var onMapLoaded = function (result) {
				var mapInfo = {
					mapId: mapId,
					idea: content(result)
				};
				dispatchEvent('mapLoaded', mapInfo);
			},
			mapUrl = s3Url + mapId + ".json",
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
		jQuery.ajax(
			mapUrl,
			{ dataType: 'json', success: onMapLoaded, error: loadMapUsingProxy }
		);
	};

	this.saveMap = function (mapInfo) {
		dispatchEvent('mapSaving');
		var publishing = true,
			saveTimeoutOccurred = function () {
				publishing = false;
				dispatchEvent('mapSavingFailed');
			},
			submitS3Form = function (result) {
				var name;
				publishing = false;
				jQuery('#s3form [name="file"]').val(JSON.stringify(mapInfo.idea));
				for (name in result) {
					jQuery('#s3form [name=' + name + ']').val(result[name]);
				}
				dispatchEvent('Before Upload', result.s3UploadIdentifier, mapInfo.idea);
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