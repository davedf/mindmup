/*jslint forin: true*/
/*global content, jQuery, MM, observable, setTimeout, window */
MM.S3MapRepository = function (s3Url, activityLog, networkTimeoutMillis) {
	'use strict';
	observable(this);
	var dispatchEvent = this.dispatchEvent;

	this.recognises = function (mapId) {
		return mapId && mapId[0] === "a";
	};

	this.loadMap = function (mapId) {
		var deferred = jQuery.Deferred(),
			onMapLoaded = function (result) {
				var mapInfo = {
					mapId: mapId,
					idea: content(result)
				};
				deferred.resolve(mapInfo);
			},
			mapUrl = s3Url + mapId + ".json",
			loadMapUsingProxy = function () {
				activityLog.log('Map', 'ProxyLoad', mapId);
				jQuery.ajax(
					'/s3proxy/' + mapId,
					{ dataType: 'json', success: onMapLoaded, error: deferred.reject }
				);
			};
		jQuery.ajax(
			mapUrl,
			{ dataType: 'json', success: onMapLoaded, error: loadMapUsingProxy }
		);
		return deferred.promise();
	};

	this.saveMap = function (mapInfo) {
		var deferred = jQuery.Deferred(),
			publishing = true,
			saveTimeoutOccurred = function () {
				publishing = false;
				deferred.reject();
			},
			submitS3Form = function (result) {
				var name;
				publishing = false;
				jQuery('#s3form [name="file"]').val(JSON.stringify(mapInfo.idea));
				for (name in result) {
					jQuery('#s3form [name=' + name + ']').val(result[name]);
				}
				//Not actually saved, but needs to happen now as form will redirect after
				dispatchEvent('mapSaved', result.s3UploadIdentifier, mapInfo.idea);
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
		return deferred.promise();
	};
};