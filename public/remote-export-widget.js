/*global $, _, jQuery*/
jQuery.fn.remoteExportWidget = function (mapRepository) {
	'use strict';
	var loadedIdea;
	mapRepository.addEventListener('mapLoaded', function (idea, mapId) {
		loadedIdea = idea;
	});
	return this.click(function () {
		var exportForm = $($(this).data('mm-target'));
		exportForm.find('[name=format]').val($(this).data('mm-format'));
		exportForm.find('[name=map]').val(JSON.stringify(loadedIdea));
		exportForm.submit();
	});
}
