/*global jQuery*/
jQuery.fn.floatingToolbarWidget = function (mapRepository) {
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
			});
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
				'<strong>Arrow keys</strong>: Move selection<br/>'
		});
		jQuery('#menuPublish').click(function () {
			jQuery('#menuPublish')
				.html('<i class="icon-spinner icon-spin"></i>Saving...')
				.removeClass('btn-primary')
				.attr('disabled', true);
			jQuery('#toolbarSave p').hide();
			mapRepository.publishMap();
		});
	});
};
