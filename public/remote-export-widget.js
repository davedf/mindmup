/*global $, _, jQuery, MM*/
jQuery.fn.remoteExportWidget = function (mapRepository) {
	'use strict';
	var loadedIdea;
	mapRepository.addEventListener('mapLoaded', function (idea, mapId) {
		loadedIdea = idea;
	});
	return this.click(function () {
		var exportForm = $($(this).data('mm-target')),
			exportFunctions = {
				'mup' : JSON.stringify,
				'mm' : MM.freemindExport,
				'html': MM.exportIdeas.bind({}, loadedIdea, new MM.HtmlTableExporter()),
				'txt': MM.exportIdeas.bind({}, loadedIdea, new MM.TabSeparatedTextExporter())
			},
			format = $(this).data('mm-format');
		if (exportFunctions[format]) {
			exportForm.find('[name=title]').val(loadedIdea.title + "." + format);
			exportForm.find('[name=map]').val(exportFunctions[format](loadedIdea));
			exportForm.submit();
		}
	});
}
