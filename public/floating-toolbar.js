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
				'<strong>Backspace</strong> or <strong>Delete</strong>: Remove node<br/>' +
				'<strong>Arrow keys</strong>: Move selection<br/>'  +
				'<strong>/</strong> or <strong>Shift+Up Arrow</strong>: Expand or collapse<br/>'
		});
		jQuery('#menuPublish').add('#toolbarSave a').click(function () {
			jQuery('#menuPublish')
				.html('<i class="icon-spinner icon-spin"></i>Saving...')
				.removeClass('btn-primary')
				.attr('disabled', true);
			jQuery('#toolbarSave p').hide();
			mapRepository.publishMap($(this).attr('data-mm-repository'));
		});
		$('#toolbarSave a[data-mm-repository]').addClass(function () {
			return 'repo-' + $(this).data('mm-repository');
		});
		mapRepository.addEventListener('mapLoaded', function (idea, mapId) {
			var repository = (mapId && mapId[0]);
			if (repository !== 'g') { repository = 'a'; } /* stupid workaround, this takes care of null, new, default and a...*/
			element.find('[data-mm-role=currentrepo]').removeClass('repo-a repo-g').addClass('repo-' + repository);
		});
		mapRepository.addEventListener('mapSavingFailed', function () {
			jQuery('#menuPublish').text('Save Map').addClass('btn-primary').attr('disabled', false);
			jQuery('#toolbarSave p').show();
		});
		mapRepository.addEventListener('mapSaved', function () {
			jQuery('#menuPublish').text('Save Map').addClass('btn-primary').attr('disabled', false);
			jQuery('#toolbarSave p').show();
		});
	});
};
