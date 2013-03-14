/*global $, _ */
$.fn.googleDriveOpenWidget = function (googleDriveRepository) {
    'use strict';
    var modal = this,
        template = this.find('[data-mm-role=template]'),
        parent = template.parent(),
        statusDiv = this.find('[data-mm-role=status]'),
        error = function (errorStatus) {
			statusDiv.html('<div class="alert fade in alert-error">' +
					'<button type="button" class="close" data-dismiss="alert">&#215;</button>' +
					'<strong>' + errorStatus + '</strong>' + '</div>');
		},
        loaded = function (fileList) {
			statusDiv.empty();
            var sorted = _.sortBy(fileList, function (file) {
                return file && file.modifiedDate;
            }).reverse();
            _.each(sorted, function (file) {
                var added = template.clone().appendTo(parent);
                added.find('a[data-mm-role=file-link]').attr('href', "/map/g1" + file.id).text(file.title.replace(/\.mup$/, ''));
                added.find('[data-mm-role=modification-status]').text('By ' + file.lastModifyingUserName + ' on ' + file.modifiedDate);
            });
        };
    template.detach();
    modal.on('show', function () {
        parent.empty();
        statusDiv.html("<i class='icon-spinner icon-spin'/> Retrieving files...");
		googleDriveRepository.ready(true).then(function () {
			googleDriveRepository.retrieveAllFiles().then(loaded, function () { error("Problem loading files from Google"); });
		}, function () { error("Cannot authenticate with Google Drive"); });
    });
    return modal;
}
