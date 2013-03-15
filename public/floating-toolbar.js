/*global $, _, jQuery, window*/
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
				'<strong>Shift Space</strong>: Change node color<br/>' +
				'<strong>Backspace</strong>/<strong>DEL</strong>: Remove<br/>' +
				'<strong>Arrow keys</strong>: Move selection<br/>'  +
				'<strong>Ctrl/Cmd Up/Down</strong>: Move node up/down<br/>'  +
				'<strong>C or Ctrl/Cmd X</strong>: mark for movement (cut)<br/>'  +
				'<strong>P or Ctrl/Cmd V</strong>: paste<br/>'  +
				'<strong>/</strong> or <strong>Shift+Up</strong>: Expand or collapse<br/>' +
				'<strong>Ctrl/Cmd Z</strong>: Undo<br/>' +
				'<strong>Ctrl/Cmd Y</strong>: Redo<br/>' +
				'<strong>Ctrl/Cmd S</strong>: Save<br/>' +
				'<strong>Ctrl/Cmd +</strong>: Zoom in<br/>' +
				'<strong>Ctrl/Cmd -</strong>: Zoom out<br/>' +
				'<strong>Ctrl/Cmd 0</strong>: Reset map view<br/>' +
				'<strong>Ctrl/Cmd B</strong>: Hide toolbar<br/>' +
				'<strong>Ctrl/Cmd Shift B</strong>: Hide top menu<br/>'
		});
	});
};
