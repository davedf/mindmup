/*global jQuery, MM, observable, setTimeout, clearTimeout, window, gapi */
MM.GoogleDriveRepository = function (clientId, apiKey, networkTimeoutMillis, contentType) {
	'use strict';
	observable(this);
	var dispatchEvent = this.dispatchEvent,
		driveLoaded,
		isAuthorised,
		recognises = function (mapId) {
			return mapId && mapId[0] === 'g';
		},
		googleMapId = function (mapId) {
			if (recognises(mapId)) {
				return mapId.substr(2);
			}
		},
		mindMupId = function (googleId) {
			return 'g1' + (googleId || '');
		},
		checkAuth = function (showDialog) {
			var deferred = jQuery.Deferred();
			gapi.auth.authorize(
				{
					'client_id': clientId,
					'scope': 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install https://www.googleapis.com/auth/userinfo.profile',
					'immediate': !showDialog
				},
				function (authResult) {
					if (authResult) {
						isAuthorised = true;
						deferred.resolve();
					} else {
						isAuthorised = false;
						deferred.reject('not-authenticated');
					}
				}
			);
			return deferred.promise();
		},
		saveFile = function (mapInfo) {
			var	googleId =  googleMapId(mapInfo.mapId),
				deferred = jQuery.Deferred(),
				boundary = '-------314159265358979323846',
				delimiter = '\r\n--' + boundary + '\r\n',
				closeDelim = '\r\n--' + boundary + '--',
				metadata = {
					'title': mapInfo.idea.title + '.mup',
					'mimeType': contentType
				},
				data = JSON.stringify(mapInfo.idea),
				multipartRequestBody =
					delimiter +
					'Content-Type: application/json\r\n\r\n' +
					JSON.stringify(metadata) +
					delimiter +
					'Content-Type: ' + contentType + '\r\n' +
					'\r\n' +
					data +
					closeDelim,
				request = gapi.client.request({
					'path': '/upload/drive/v2/files' + (googleId ? '/' + googleId : ''),
					'method': (googleId ? 'PUT' : 'POST'),
					'params': {'uploadType': 'multipart', 'useContentAsIndexableText': (data.length < 131072)}, /* google refuses indexable text larger than 128k, see https://developers.google.com/drive/file */
					'headers': {
						'Content-Type': 'multipart/mixed; boundary=\'' + boundary + '\''
					},
					'body': multipartRequestBody
				});
			try {
				request.execute(function (resp) {
					if (resp.error) {
						if (resp.error.code === 403) {
							if (resp.error.reason && (resp.error.reason === 'rateLimitExceeded' || resp.error.reason === 'userRateLimitExceeded')) {
								deferred.reject('network-error');
							} else {
								deferred.reject('no-access-allowed');
							}
						} else if (resp.error.code === 401) {
							checkAuth(false).then(
								function () {
									saveFile(mapInfo).then(deferred.resolve, deferred.reject);
								},
								deferred.reject
							);
						} else {
							deferred.reject(resp.error);
						}
					} else {
						if (!googleId) {
							mapInfo.mapId = mindMupId(resp.id);
						}
						deferred.resolve(mapInfo);
					}
				});
			} catch (e) {
				deferred.reject('network-error', e);
			}
			return deferred.promise();
		},
		downloadFile = function (file) {
			var deferred = jQuery.Deferred();
			if (file.downloadUrl) {
				jQuery.ajax(
					file.downloadUrl,
					{
						success: deferred.resolve,
						error: function (resp) {
							deferred.reject('network-error', resp);
						},
						headers: {'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }
					}
				);
			} else {
				deferred.reject();
			}
			return deferred.promise();
		},
		loadFile = function (fileId) {
			var allowUpdate = { 'application/json': true, 'application/octet-stream': true, 'application/x-freemind': false },
				deferred = jQuery.Deferred(),
				request = gapi.client.drive.files.get({
					'fileId': fileId
				});
			request.execute(function (resp) {
				var mimeType = resp.mimeType;
				if (resp.error) {
					if (resp.error.code === 403) {
						deferred.reject('network-error');
					} else if (resp.error.code === 404) {
						deferred.reject('no-access-allowed');
					} else {
						deferred.reject(resp.error);
					}
				} else {
					downloadFile(resp).then(function (content) {
						if (allowUpdate[mimeType] === undefined) {
							deferred.reject('format-error', 'Unsupported format ' + mimeType);
						} else {
							deferred.resolve(content, mimeType, allowUpdate[resp.mimeType]);
						}
					}, deferred.reject);
				}
			});
			return deferred.promise();
		},
		authenticate = function (showAuthenticationDialogs) {
			var deferred = jQuery.Deferred(),
				failureReason = showAuthenticationDialogs ? 'failed-authentication' : 'not-authenticated';
			checkAuth(showAuthenticationDialogs).then(deferred.resolve, function () {
				deferred.reject(failureReason);
			});
			return deferred.promise();
		},
		loadApi = function (onComplete) {
			if (window.gapi && window.gapi.client) {
				onComplete();
			} else {
				window.googleClientLoaded = onComplete;
				jQuery('<script src="https://apis.google.com/js/client.js?onload=googleClientLoaded"></script>').appendTo('body');
			}
		},
		makeReady = function (showAuthenticationDialogs) {
			var deferred = jQuery.Deferred();
			if (driveLoaded) {
				authenticate(showAuthenticationDialogs).then(deferred.resolve, deferred.reject);
			} else {
				loadApi(function () {
					gapi.client.setApiKey(apiKey);
					gapi.client.load('drive', 'v2', function () {
						driveLoaded = true;
						authenticate(showAuthenticationDialogs).then(deferred.resolve, deferred.reject);
					});
				});
			}
			return deferred.promise();
		};
	this.description = 'Google';

	this.ready = function (showAuthenticationDialogs) {
		var deferred = jQuery.Deferred();
		if (driveLoaded && isAuthorised) {
			deferred.resolve();
		} else {
			makeReady(showAuthenticationDialogs).then(deferred.resolve, deferred.reject);
		}
		return deferred.promise();
	};

	this.recognises = recognises;

	this.retrieveAllFiles = function (searchCriteria) {
		var deferred = jQuery.Deferred(),
			retrievePageOfFiles = function (request, result) {
				request.execute(function (resp) {
					result = result.concat(resp.items);
					var nextPageToken = resp.nextPageToken;
					if (nextPageToken) {
						request = gapi.client.drive.files.list({
							'pageToken': nextPageToken,
							q: searchCriteria
						});
						retrievePageOfFiles(request, result);
					} else {
						deferred.resolve(result);
					}
				});
			};
		searchCriteria = searchCriteria || 'mimeType = \'' + contentType + '\' and not trashed';
		retrievePageOfFiles(gapi.client.drive.files.list({ 'q': searchCriteria }), []);
		return deferred.promise();
	};

	this.loadMap = function (mapId, showAuthenticationDialogs) {
		var deferred = jQuery.Deferred(),
			maxRetrys = 5,
			timeout,
			googleId = googleMapId(mapId),
			startLoad = function (recursionCount) {
				var retry = function () {
						startLoad(recursionCount++);
					},
					loadSucceeded = function (content, mimeType, allowUpdate) {
						clearTimeout(timeout);
						deferred.resolve(content, mindMupId(allowUpdate && googleId), mimeType);
					},
					loadFailed = function (reason, error) {
						clearTimeout(timeout);
						if (error) {
							dispatchEvent('networkError', error);
						}
						if (recursionCount < maxRetrys && reason === 'network-error') {
							setTimeout(retry, recursionCount * 1000);
						} else {
							deferred.reject(reason);
						}
					};
				timeout = setTimeout(deferred.reject, networkTimeoutMillis);
				loadFile(googleId).then(loadSucceeded, loadFailed);
			},
			readySucceeded = function () {
				startLoad(0);
			};
		this.ready(showAuthenticationDialogs).then(readySucceeded, deferred.reject);
		return deferred.promise();
	};

	this.saveMap = function (mapInfo, showAuthenticationDialogs) {
		var deferred = jQuery.Deferred(),
			timeout,
			maxRetrys = 5,
			startSave = function (recursionCount) {
				var retry = function () {
						startSave(recursionCount++);
					},
					saveSucceeded = function (savedMapInfo) {
						clearTimeout(timeout);
						deferred.resolve(savedMapInfo);
					},
					saveFailed = function (reason, error) {
						clearTimeout(timeout);
						if (error) {
							dispatchEvent('networkError', error);
						}
						if (recursionCount < maxRetrys && reason === 'network-error') {
							setTimeout(retry, recursionCount * 1000);
						} else {
							deferred.reject(reason);
						}
					};
				timeout = setTimeout(deferred.reject, networkTimeoutMillis);
				saveFile(mapInfo).then(saveSucceeded, saveFailed);
			},
			readySucceeded = function () {
				startSave(0);
			};
		this.ready(showAuthenticationDialogs).then(readySucceeded, deferred.reject);
		return deferred.promise();
	};
};
