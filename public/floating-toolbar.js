/*global $, _, jQuery*/
jQuery.fn.floatingToolbarWidget = function (mapRepository, pngExporter, toggleClassTarget) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this), loadedIdea,
			keyboardShortcuts = element.find('.keyboardShortcuts'),
			toggleButton = element.find('.toggle'),
			exportForm = $('#formExport');
		element
			.draggable({containment: 'window'})
			.find('[data-mm-role="toggle-toolbar"]').click(function () {
				toggleClassTarget.addClass('collapsed-toolbar');
			});
		element.find('[data-mm-role="png-export"]').click(pngExporter.exportMap);
		element.find('[data-mm-role="remote-export"]').click(function () {
			exportForm.find('[name=format]').val($(this).data('mm-format'));
			exportForm.find('[name=map]').val(JSON.stringify(loadedIdea));
			exportForm.submit();
		});
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
		mapRepository.addEventListener('mapLoaded', function (idea, mapId) {
			loadedIdea = idea;
		});
	});
};
