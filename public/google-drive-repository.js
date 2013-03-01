/*global content, jQuery, MM, observable, setTimeout, clearTimeout, window, gapi, btoa, XMLHttpRequest */
MM.GoogleDriveRepository = function (clientId, apiKey, networkTimeoutMillis, contentType) {
	'use strict';
	observable(this);
	var driveLoaded,
		isAuthorised,
		dispatchEvent = this.dispatchEvent,
		saveFile = function (mapInfo, complete, fail) {
			var	boundary = '-------314159265358979323846',
				delimiter = "\r\n--" + boundary + "\r\n",
				close_delim = "\r\n--" + boundary + "--",
				metadata = {
					'title': mapInfo.idea.title + ".mup",
					'mimeType': contentType
				},
				//base64Data = btoa(JSON.stringify(mapInfo.idea)),
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
					'path': '/upload/drive/v2/files' + (mapInfo.googleId ? "/" + mapInfo.googleId : ""),
					'method': (mapInfo.googleId ? 'PUT' : 'POST'),
					'params': {'uploadType': 'multipart'},
					'headers': {
						'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
					},
					'body': multipartRequestBody
				});
			request.execute(function (resp) {
				if (resp.error) {
					if (fail) {
						fail(resp.error);
					}
				} else if (complete) {
					if (!mapInfo.googleId) {
						mapInfo.mapId = "g1" + resp.id;
						mapInfo.googleId = resp.id;
					}
					complete(mapInfo);
				}
			});
		},
		downloadFile = function (file, complete, fail) {
			if (file.downloadUrl) {
				var xhr = new XMLHttpRequest();
				xhr.open('GET', file.downloadUrl);
				if (file.title) {
					xhr.setRequestHeader('Authorization', 'Bearer ' + gapi.auth.getToken().access_token);
				}
				xhr.onload = function () {
					if (complete) {
						complete({
							title: file.title || 'unknown',
							body: JSON.parse(xhr.responseText)
						});
					}
				};
				xhr.onerror = function () {
					if (fail) {
						fail();
					}
				};
				xhr.send();
			} else if (fail) {
				fail();
			}
		},
		loadFile = function (fileId, complete, fail) {
			var request = gapi.client.drive.files.get({
				'fileId': fileId
			});
			request.execute(function (resp) {
				if (resp.error) {
					fail(resp.error);
				} else {
					downloadFile(resp, complete, fail);
				}
			});
		};
	this.use = function (doThis, fail) {
		var self = this;
		if (self.ready()) {
			doThis();
		} else {
			self.makeReady(doThis, fail);
		}
	};

	this.ready = function () {
		return driveLoaded && isAuthorised;
	};

	this.recognises = function (mapId) {
		return mapId && mapId[0] === "g";
	};

	this.checkAuth = function (showDialog, complete, failure) {
		gapi.auth.authorize(
			{
				'client_id': clientId,
				'scope': 'https://www.googleapis.com/auth/drive',
				'immediate': !showDialog
			},
			function (authResult) {
				if (authResult) {
					isAuthorised = true;
					if (complete) {
						complete();
					}
				} else if (failure) {
					isAuthorised = false;
					failure();
				}

			}
		);
	};
	this.authenticate = function (complete, failure) {
		var self = this;
		this.checkAuth(false, complete, function () {
			self.dispatchEvent('authRequired', 'This operation requires authentication through Google!', function () {
				self.checkAuth(true, complete, failure);
			});
		});
	};
	this.makeReady = function (complete, failure) {
		var self = this;
		if (driveLoaded) {
			this.authenticate();
			return;
		}
		this.loadApi(function () {
			gapi.client.setApiKey(apiKey);
			gapi.client.load('drive', 'v2', function () {
				driveLoaded = true;
				self.authenticate(complete, failure);
			});
		});
	};

	this.retrieveAllFiles = function (callback) {
		var searchCriteria = "mimeType = '" + contentType + "' and not trashed",
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
						callback(result);
					}
				});
			},
			initialRequest = gapi.client.drive.files.list({
				'q': searchCriteria
			});
		retrievePageOfFiles(initialRequest, []);
	};
	this.loadApi = function (onComplete) {
		if (window.gapi && window.gapi.client) {
			onComplete();
		} else {
			window.googleClientLoaded = function () { onComplete(); };
			jQuery('<script src="https://apis.google.com/js/client.js?onload=googleClientLoaded"></script>').appendTo('body');
		}
	};
	this.loadMap = function (mapId) {
		var deferred = jQuery.Deferred(),
			googleId = mapId.substr(2),
			success = function (result) {
				var mapInfo = {
					mapId: mapId,
					googleId: googleId,
					idea: content(result.body)
				};
				deferred.resolve(mapInfo);
			};
		loadFile(googleId, success, deferred.reject);
		return deferred.promise();
	};

	this.saveMap = function (mapInfo) {
		var deferred = jQuery.Deferred(),
			timeout = setTimeout(deferred.reject, networkTimeoutMillis);
		saveFile(
			mapInfo,
			function (savedMapInfo) {
				clearTimeout(timeout);
				deferred.resolve(savedMapInfo);
			},
			deferred.reject
		);
		return deferred.promise();
	};
};

