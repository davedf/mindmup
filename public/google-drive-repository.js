/*global content, jQuery, MM, observable, setTimeout, window, gapi, btoa, XMLHttpRequest */
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
					'title': mapInfo.title,
					'mimeType': contentType
				},
				base64Data = btoa(JSON.stringify(mapInfo.idea)),
				multipartRequestBody =
					delimiter +
					'Content-Type: application/json\r\n\r\n' +
					JSON.stringify(metadata) +
					delimiter +
					'Content-Type: ' + contentType + '\r\n' +
					'Content-Transfer-Encoding: base64\r\n' +
					'\r\n' +
					base64Data +
					close_delim,
				request = gapi.client.request({
					'path': '/upload/drive/v2/files' + (mapInfo.id ? "/" + mapInfo.id : ""),
					'method': (mapInfo.id ? 'PUT' : 'POST'),
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
					complete(resp.id);
				}
			});
		},
		downloadFile = function (file, complete, fail) {
			if (file.downloadUrl) {
				var accessToken = gapi.auth.getToken().access_token,
					xhr = new XMLHttpRequest();
				xhr.open('GET', file.downloadUrl);
				xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
				xhr.onload = function () {
					if (complete) {
						complete({
							title: file.title,
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

	this.ready = function () {
		return driveLoaded && isAuthorised;
	};

	this.recognises = function (mapId) {
		return mapId.substr(0, 2) === "gd";
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

	this.loadDrive = function (complete, failure) {
		var checkAuth = this.checkAuth;
		if (driveLoaded) {
			checkAuth(false, complete, failure);
			return;
		}
		gapi.client.setApiKey(apiKey);
		gapi.client.load('drive', 'v2', function () {
			driveLoaded = true;
			checkAuth(false, complete, failure);
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

	this.loadMap = function (mapId) {
		var fileId = mapId.substr(2),
			success = function (result) {
				var mapInfo = {
					id: fileId,
					idea: content(result.body),
					title: result.title
				};
				dispatchEvent('mapLoaded', mapInfo);
			},
			fail = function (xhr, textStatus, errorMsg) {
				dispatchEvent('mapLoadingFailed', 'status=' + textStatus + ' error msg=' + errorMsg);
			};
		dispatchEvent('mapLoading', mapId);
		loadFile(fileId, success, fail);
	};

	this.saveMap = function (mapInfo) {
		dispatchEvent('mapSaving');
		var saveFailed = function () {
				dispatchEvent('mapSavingFailed');
			};
		setTimeout(saveFailed, networkTimeoutMillis);
		saveFile(mapInfo, function (savedMapInfo) { dispatchEvent('mapSaved', savedMapInfo); }, saveFailed);
	};
};

