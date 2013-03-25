/*global $, _, jQuery, MM, document*/
jQuery.fn.remoteExportWidget = function (mapRepository) {
	'use strict';
	var loadedIdea,
		downloadAttrSupported = (document.createElement('a').hasOwnProperty('download'));
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
			format = $(this).data('mm-format'),
		    title = loadedIdea.title + "." + format,
		    contents = exportFunctions[format] && exportFunctions[format](loadedIdea);
		if (!contents) {
			return false;
		}
		if (downloadAttrSupported && (!$('body').hasClass('force-remote'))) {
			$(this).attr('download', title);
			$(this).attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents));
		} else {
			$(this).attr('href', '#');
			delete this.download;
			exportForm.find('[name=title]').val(title);
			exportForm.find('[name=map]').val(contents);
			exportForm.submit();
		}
	});
}
