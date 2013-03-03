/*global $, content*/
$.fn.importWidget = function (activityLog, mapRepository) {
	'use strict';
	var element = this,
		statusDiv = element.find('[data-mm-role=status]'),
		fileInput = element.find('input[type=file]'),
		selectButton = element.find('[data-mm-role=select-file]'),
		start = function (filename) {
			activityLog.log('Map', 'import:start', filename);
			statusDiv.html("<i class='icon-spinner'/> Uploading " + filename);
		},
		success = function (json_content) {
			var idea = content(json_content);
			activityLog.log('Map', 'import:complete');
			statusDiv.empty();
			element.modal('hide');
			mapRepository.setMap({ idea: idea });
		},
		fail = function (error, detail) {
			activityLog.log('Map', 'import:fail', error);
			statusDiv.html(
				'<div class="alert fade in alert-error">' +
					'<button type="button" class="close" data-dismiss="alert">&#215;</button>' +
					'<strong>' + error + '</strong>' +
					'</div>'
			);
		};
	fileInput.json_upload('/import', start, success, fail);
	element.on('shown', function () {
		fileInput.css('opacity', 0).css('position', 'absolute').offset(selectButton.offset()).width(selectButton.outerWidth())
			.height(selectButton.outerHeight());
	});
	return element;
}
