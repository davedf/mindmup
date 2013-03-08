/*global $, _, jQuery*/
jQuery.fn.floatingToolbarWidget = function (mapRepository, pngExporter) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this), loadedIdea,
			keyboardShortcuts = element.find('.keyboardShortcuts'),
			toggleButton = element.find('.toggle');
		element.draggable({containment: 'window'});
		keyboardShortcuts.popover({
			placement: 'bottom',
			trigger: 'click',
			html: 'true',
			content: '<strong>Enter</strong>: Add sibling<br/>' +
				'<strong>Tab</strong>: Add child<br/>' +
				'<strong>Shift+Tab</strong>: Insert parent<br/>' +
				'<strong>Space</strong>: Edit node<br/>' +
				'<strong>Backspace</strong>/<strong>DEL</strong>: Remove<br/>' +
				'<strong>Arrow keys</strong>: Move selection<br/>'  +
				'<strong>/</strong> or <strong>Shift+Up</strong>: Expand or collapse<br/>' +
				'<strong>Ctrl+Z</strong>/<strong>Cmd+Z</strong>: Undo<br/>' +
				'<strong>Ctrl+Y</strong>/<strong>Cmd+Y</strong>: Redo<br/>'
		});
	});
};
