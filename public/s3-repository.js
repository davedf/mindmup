/*jslint forin: true*/
/*global content, FormData, jQuery, MM, observable, setTimeout, window */
MM.S3MapRepository = function (s3Url, folder, activityLog, networkTimeoutMillis) {
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
			mapUrl = s3Url + folder + mapId + '.json',
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
	this.description = "S3_CORS";

	this.saveMap = function (mapInfo) {
		var deferred = jQuery.Deferred(),
			publishing = true,
			saveTimeoutOccurred = function () {
				publishing = false;
				deferred.reject();
			},
			submitS3Form = function (publishingConfig) {
				var formData = new FormData();
				publishing = false;
				['key', 'AWSAccessKeyId', 'policy', 'signature'].forEach(function (parameter) {
					formData.append(parameter, publishingConfig[parameter]);
				});
				formData.append('acl', 'public-read');
				formData.append('Content-Type', 'text/plain');
				formData.append('file', JSON.stringify(mapInfo.idea));
				jQuery.ajax({
					url: s3Url,
					type: 'POST',
					processData: false,
					contentType: false,
					data: formData
				}).done(function (evt) {
					mapInfo.mapId = publishingConfig.s3UploadIdentifier;
					deferred.resolve(mapInfo);
				}).fail(function (evt) {
					deferred.reject({
						type: 's3-save-error',
						responseText: evt.responseText
					});
				});
			},
			fetchPublishingConfig = function () {
				activityLog.log('Fetching publishing config');
				jQuery.ajax(
					'/publishingConfig?no_redirect=true',
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
