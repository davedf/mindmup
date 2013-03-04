/*global content, jQuery, MM, observable, setTimeout, clearTimeout, window, gapi, btoa, XMLHttpRequest */
MM.GoogleDriveRepository = function (clientId, apiKey, networkTimeoutMillis, contentType) {
	'use strict';
	var driveLoaded,
		isAuthorised,
		recognises = function (mapId) {
			return mapId && mapId[0] === "g";
		},
		googleMapId = function (mapId) {
			if (recognises(mapId)) {
				return mapId.substr(2);
			}
		},
		saveFile = function (mapInfo) {
			var	googleId =  googleMapId(mapInfo.mapId),
				deferred = jQuery.Deferred(),
				boundary = '-------314159265358979323846',
				delimiter = "\r\n--" + boundary + "\r\n",
				close_delim = "\r\n--" + boundary + "--",
				metadata = {
					'title': mapInfo.idea.title + ".mup",
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
					close_delim,
				request = gapi.client.request({
					'path': '/upload/drive/v2/files' + (googleId ? "/" + googleId : ""),
					'method': (googleId ? 'PUT' : 'POST'),
					'params': {'uploadType': 'multipart'},
					'headers': {
						'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
					},
					'body': multipartRequestBody
				});
			request.execute(function (resp) {
				if (resp.error) {
					if (resp.error.code === 403) {
						deferred.reject('no-access-allowed');
					} else {
						deferred.reject(resp.error);
					}
				} else {
					if (!googleId) {
						mapInfo.mapId = "g1" + resp.id;
					}
					deferred.resolve(mapInfo);
				}
			});
			return deferred.promise();
		},
		downloadFile = function (file) {
			var deferred = jQuery.Deferred(),
				xhr;
			if (file.downloadUrl) {
				xhr = new XMLHttpRequest();
				xhr.open('GET', file.downloadUrl);
				if (file.title) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + gapi.auth.getToken().access_token);
				}
				xhr.onload = function () {
					deferred.resolve({
						title: file.title || 'unknown',
						body: JSON.parse(xhr.responseText)
					});
				};
				xhr.onerror = deferred.reject;
				xhr.send();
			} else {
				deferred.reject();
			}
			return deferred.promise();
		},
		loadFile = function (fileId) {
			var deferred = jQuery.Deferred(),
				request = gapi.client.drive.files.get({
					'fileId': fileId
				});
			request.execute(function (resp) {
				if (resp.error) {
					if (resp.error.code === 404) {
						deferred.reject('no-access-allowed');
					} else {
						deferred.reject(resp.error);
					}
				} else {
					downloadFile(resp).then(deferred.resolve, deferred.reject);
				}
			});
			return deferred.promise();
		},
		checkAuth = function (showDialog) {
			var deferred = jQuery.Deferred();
			gapi.auth.authorize(
				{
					'client_id': clientId,
					'scope': 'https://www.googleapis.com/auth/drive  https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.install https://www.googleapis.com/auth/userinfo.profile',
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
		authenticate = function (showAuthenticationDialogs) {
			var self = this,
				deferred = jQuery.Deferred(),
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
				window.googleClientLoaded = function () { onComplete(); };
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
	this.description = "Google";

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

	this.retrieveAllFiles = function () {
		var deferred = jQuery.Deferred(),
			searchCriteria = "mimeType = '" + contentType + "' and not trashed",
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
						deferred.resolve();
					}
				});
			},
			initialRequest = gapi.client.drive.files.list({
				'q': searchCriteria
			});
		retrievePageOfFiles(initialRequest, []);
		return deferred.promise();
	};



	this.loadMap = function (mapId, showAuthenticationDialogs) {
		var deferred = jQuery.Deferred(),
			googleId = googleMapId(mapId),
			loadSucceeded = function (result) {
				var mapInfo = {
					mapId: mapId,
					idea: content(result.body)
				};
				deferred.resolve(mapInfo);
			},
			readySucceeded = function () {
				loadFile(googleId).then(loadSucceeded, deferred.reject);
			};
		this.ready(showAuthenticationDialogs).then(readySucceeded, deferred.reject);
		return deferred.promise();
	};

	this.saveMap = function (mapInfo, showAuthenticationDialogs) {
		var deferred = jQuery.Deferred(),
			timeout,
			saveSucceeded = function (savedMapInfo) {
				clearTimeout(timeout);
				deferred.resolve(savedMapInfo);
			},
			saveFailed = function (reason) {
				clearTimeout(timeout);
				deferred.reject(reason);
			},
			readySucceeded = function () {
				timeout = setTimeout(deferred.reject, networkTimeoutMillis);
				saveFile(mapInfo).then(saveSucceeded, saveFailed);
			};
		this.ready(showAuthenticationDialogs).then(readySucceeded, deferred.reject);
		return deferred.promise();

	};
};

