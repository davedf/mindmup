/*global $, _ */
$.fn.localStorageOpenWidget = function (offlineMapStorage) {
    'use strict';
    var modal = this,
        template = this.find('[data-mm-role=template]'),
        parent = template.parent(),
        statusDiv = this.find('[data-mm-role=status]'),
		showAlert = function (message, type) {
			type = type || 'block';
			statusDiv.html('<div class="alert fade-in alert-' + type + '">' +
					'<button type="button" class="close" data-dismiss="alert">&#215;</button>' +
					'<strong>' + message + '</strong>' + '</div>');
		},
        loaded = function (fileMap) {
			statusDiv.empty();
            var sorted = [];
            _.each(fileMap, function (value, key) {
				sorted.push({id: key, title: value.d, modifiedDate: value.t * 1000});
            });
            console.log('fileMap', fileMap, 'unsorted', sorted);
			sorted = _.sortBy(sorted, function (file) {
                return file && file.modifiedDate;
            }).reverse();
            console.log('sorted', sorted);
            _.each(sorted, function (file) {
                var added;
				if (file) {
					added = template.clone().appendTo(parent);
					added.find('a[data-mm-role=file-link]').attr('href', '/map/' + file.id).text(file.title);
					added.find('[data-mm-role=modification-status]').text(new Date(file.modifiedDate).toLocaleString());
				}
            });
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
