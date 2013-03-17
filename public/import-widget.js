/*global $, content, MM, window*/
$.fn.importWidget = function (activityLog, mapRepository) {
	'use strict';
	var element = this,
		uploadType,
		statusDiv = element.find('[data-mm-role=status]'),
		fileInput = element.find('input[type=file]'),
		selectButton = element.find('[data-mm-role=select-file]'),
		start = function (filename) {
			activityLog.log('Map', 'import:start ' + uploadType, filename);
			statusDiv.html("<i class='icon-spinner icon-spin'/> Uploading " + filename);
		},
		parseFile = function (file_content, type) {
			if (type === 'mm') {
				return MM.freemindImport(file_content);
			}
			if (type === 'mup') {
				return JSON.parse(file_content);
			}
		},
		fail = function (error, detail) {
			activityLog.log('Map', 'import:fail', error);
			statusDiv.html(
				'<div class="alert fade in alert-error">' +
					'<button type="button" class="close" data-dismiss="alert">&#215;</button>' +
					'<strong>' + error + '</strong>' +
					'</div>'
			);
		},
		success = function (file_content, type) {
			var idea, json_content;
			statusDiv.html("<i class='icon-spinner icon-spin'/> Processing file");
			if (type !== 'mup' && type !== 'mm') {
				fail('unsupported format ' + type);
			}
			try {
				json_content = parseFile(file_content, type);
			} catch (e) {
				fail('invalid file content', e);
			}
			idea = content(json_content);
			activityLog.log('Map', 'import:complete');
			statusDiv.empty();
			element.modal('hide');
			mapRepository.setMap({ idea: idea });
		},
		shouldUseFileReader = function () {
			return (window.File && window.FileReader && window.FileList && window.Blob && (!$('body').hasClass('disable-filereader')));
		};
	if (shouldUseFileReader()) {
		fileInput.file_reader_upload(start, success, fail);
		uploadType = 'FileReader';
	} else {
		fileInput.background_upload('/import', start, success, fail);
		uploadType = 'Remote Upload';
	}
	element.on('shown', function () {
		fileInput.css('opacity', 0).css('position', 'absolute').offset(selectButton.offset()).width(selectButton.outerWidth())
			.height(selectButton.outerHeight());
	});
	return element;
}
