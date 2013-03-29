/*global $, _ */
$.fn.googleDriveOpenWidget = function (googleDriveRepository) {
    'use strict';
    var modal = this,
        template = this.find('[data-mm-role=template]'),
		query,
        parent = template.parent(),
        statusDiv = this.find('[data-mm-role=status]'),
		showAlert = function (message, type) {
			type = type || 'block';
			statusDiv.html('<div class="alert fade-in alert-' + type + '">' +
					'<button type="button" class="close" data-dismiss="alert">&#215;</button>' +
					'<strong>' + message + '</strong>' + '</div>');
		},
        error = function (errorStatus) {
			showAlert(errorStatus, 'error');
		},
        loaded = function (fileList) {
			statusDiv.empty();
            var sorted = _.sortBy(fileList, function (file) {
                return file && file.modifiedDate;
            }).reverse();
            _.each(sorted, function (file) {
                var added;
				if (file) {
					added = template.clone().appendTo(parent);
					added.find('a[data-mm-role=file-link]').attr('href', "/map/g1" + file.id).text(file.title.replace(/\.mup$/, ''));
					added.find('[data-mm-role=modification-status]').text('By ' + file.lastModifyingUserName + ' on ' +
						new Date(file.modifiedDate).toLocaleString());
				}
            });
        },
		fileRetrieval = function (showPopup) {
			parent.empty();
			statusDiv.html("<i class='icon-spinner icon-spin'/> Retrieving files...");
			googleDriveRepository.ready(showPopup).then(function () {
				googleDriveRepository.retrieveAllFiles(query).then(loaded, function () { error("Problem loading files from Google"); });
			}, function (reason) {
				if (reason === 'failed-authentication') {
					error("Authentication failed, we were not able to access your Google Drive");
				} else if (reason === 'not-authenticated') {
					showAlert("<h4>Authorisation required</h4>" +
						"<p>This action requires authorisation to access your Google Drive. <br/><a href='#'>Click here to authorise</a></p>");
					statusDiv.find('a').click(function () {
						fileRetrieval(true);
					});
				} else {
					error("There was a network error, please try again later");
				}
			});
		};
    template.detach();
	modal.find('[data-mm-mimetype]').click(function () {
		if ($(this).data('mm-mimetype')) {
			query = "mimeType='" + $(this).data('mm-mimetype') + "' and not trashed";
		} else {
			query = undefined;
		}
	});
    modal.on('show', function () {
		fileRetrieval(false);
    });
    return modal;
}
