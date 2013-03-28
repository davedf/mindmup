/*global $, _ */
$.fn.localStorageOpenWidget = function (offlineMapStorage) {
    'use strict';
    var modal = this,
        template = this.find('[data-mm-role=template]'),
        parent = template.parent(),
        statusDiv = this.find('[data-mm-role=status]'),
		showAlert = function (message, type, prompt, callback) {
			type = type || 'block';
			var html = '<div class="alert fade-in alert-' + type + '">' +
					'<button type="button" class="close" data-dismiss="alert">&#215;</button>' +
					'<strong>' + message + '</strong>';
			if (callback && prompt) {
				html = html + '&nbsp;<a href="#" data-mm-role="auth">' + prompt + '</a>';
			}
			html = html + '</div>';
			statusDiv.html(html);
			$('[data-mm-role=auth]').click(function () {
				statusDiv.empty();
				callback();
			});

		},
		restoreMap = function (mapId, map, mapInfo) {
			offlineMapStorage.restore(mapId, map, mapInfo);
			fileRetrieval();
		},
		deleteMap = function (mapId, mapInfo) {
			var map = offlineMapStorage.load(mapId);
			offlineMapStorage.remove(mapId);
			fileRetrieval();
			showAlert('Map "' + map.title + '" removed.', 'info', 'Undo', restoreMap.bind(undefined, mapId, map, mapInfo));
		},
        loaded = function (fileMap) {
			statusDiv.empty();
            var sorted = [];
            _.each(fileMap, function (value, key) {
				sorted.push({id: key, title: value.d, modifiedDate: value.t * 1000, info: value});
            });
			sorted = _.sortBy(sorted, function (file) {
                return file && file.modifiedDate;
            }).reverse();
            if (sorted && sorted.length > 0) {
	            _.each(sorted, function (file) {
	                var added;
					if (file) {
						added = template.clone().appendTo(parent);
						added.find('a[data-mm-role=file-link]').attr('href', '/map/' + file.id).text(file.title);
						added.find('[data-mm-role=modification-status]').text(new Date(file.modifiedDate).toLocaleString());
						added.find('[data-mm-role=map-delete]').click(deleteMap.bind(undefined, file.id, file.info));
					}
	            });
            } else {
				$('<tr><td colspan="3">No maps found in Browser storage</td></tr>').appendTo(parent);
            }

        },
		fileRetrieval = function () {
			parent.empty();
			statusDiv.html('<i class="icon-spinner icon-spin"/> Retrieving files...');
			var fileMap;
			try {
				fileMap = offlineMapStorage.list();
				loaded(fileMap);
			} catch (e) {
				showAlert('Unable to retrieve files from browser storage', 'error');
			}
		};
    template.detach();
    modal.on('show', function () {
		fileRetrieval();
    });
    return modal;
};
