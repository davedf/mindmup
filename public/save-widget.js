/*global window, $, _, jQuery*/
jQuery.fn.saveWidget = function (mapRepository) {
	'use strict';
	var mapChanged = false,
		mapChangedListener = function () {
			mapChanged = true;
		};
	$(window).keydown(function (evt) {
		if (mapChanged && evt.which === 83 && (evt.metaKey || evt.ctrlKey)) {
			mapRepository.publishMap();
			evt.preventDefault();
		}
	});
	return this.each(function () {
		var element = jQuery(this),
			resetSaveButtonEvents = ['mapSavingFailed', 'mapSavingUnAuthorized', 'authorisationFailed', 'authRequired'],
			resetSaveButton = function () {
				if (element.find('[data-mm-role=publish]').attr('disabled')) {
					element.find('[data-mm-role=publish]').text('Save').addClass('btn-primary').attr('disabled', false);
					element.find('p').show();
				}
			};
		element.find('[data-mm-role=publish]').add('a', element).click(function () {
			mapRepository.publishMap($(this).attr('data-mm-repository'));
		});
		element.find('a[data-mm-repository]').addClass(function () {
			return 'repo-' + $(this).data('mm-repository');
		});
		mapRepository.addEventListener('mapLoaded', function (idea, mapId) {
			var repository = (mapId && mapId[0]);
			if (repository !== 'g') { repository = 'a'; } /* stupid workaround, this takes care of null, new, default and a...*/
			element.find('[data-mm-role=currentrepo]').removeClass('repo-a repo-g').addClass('repo-' + repository);
			idea.addEventListener('changed', mapChangedListener);
			mapChanged = false;
		});
		mapRepository.addEventListener('mapSaving', function () {
			element.find('[data-mm-role=publish]')
				.html('<i class="icon-spinner icon-spin"></i>Saving...')
				.removeClass('btn-primary')
				.attr('disabled', true);
			element.find('p').hide();
		});
		_.each(resetSaveButtonEvents, function (eventName) {
			mapRepository.addEventListener(eventName, resetSaveButton);
		});

		mapRepository.addEventListener('mapSaved', function () {
			mapChanged = false;
			element.find('[data-mm-role=publish]').text('Save').addClass('btn-primary').attr('disabled', false);
			element.find('p').show();
		});
	});
}
