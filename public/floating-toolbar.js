/*global $, _, jQuery, window*/
jQuery.fn.floatingToolbarWidget = function (mapRepository, pngExporter) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this), loadedIdea,
			keyboardShortcuts = element.find('.keyboardShortcuts'),
			toggleButton = element.find('.toggle');
		element.draggable({containment: 'window'});
	});
};
