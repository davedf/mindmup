/*global $, jQuery*/
jQuery.fn.floatingToolbarWidget = function (mapRepository, pngExporter) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
			keyboardShortcuts = element.find('.keyboardShortcuts'),
			toggleButton = element.find('.toggle');
		element
			.draggable({containment: 'window'})
			.find('button.close').click(function () {
				element.find('.toolbar-inner').toggle();
				toggleButton.toggleClass('icon-resize-small').toggleClass('icon-resize-full');
			}).end()
			.find('[data-mm-role="png-export"]').click(pngExporter.exportMap);
		keyboardShortcuts.popover({
			placement: function () {
				return keyboardShortcuts.offset().left < 250 ? 'right' : 'left';
			},
			trigger: 'click',
			html: 'true',
			content: '<strong>Enter</strong>: Add sibling<br/>' +
				'<strong>Tab</strong>: Add child<br/>' +
				'<strong>Shift+Tab</strong>: Insert parent<br/>' +
				'<strong>Space</strong>: Edit node<br/>' +
				'<strong>Backspace</strong>: Remove node<br/>' +
				'<strong>Delete</strong>: Remove node<br/>' +
				'<strong>Arrow keys</strong>: Move selection<br/>'  +
				'<strong>Shift + Up Arrow</strong>: Expand or collapse an idea<br/>'
		});
		jQuery('#menuPublish').add('#toolbarSave a').click(function () {
			jQuery('#menuPublish')
				.html('<i class="icon-spinner icon-spin"></i>Saving...')
				.removeClass('btn-primary')
				.attr('disabled', true);
			jQuery('#toolbarSave p').hide();
			mapRepository.publishMap($(this).attr('data-mm-repository'));
		});
		mapRepository.addEventListener('mapLoaded', function (idea, mapId) {
			var repository = (mapId && mapId[0]) || 'a';
			element.find('[data-mm-role=currentrepo]').prop('src', element.find('[data-mm-repository=' + repository + '] img').prop('src'));
		});
	});
};
