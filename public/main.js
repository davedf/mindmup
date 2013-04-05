/*jslint nomen: true*/
/*global _gaq, document, jQuery, MM, MAPJS, window, localStorage*/
MM.main = function (config) {
	'use strict';
	var setupTracking = function (activityLog, jotForm, mapModel) {
		activityLog.addEventListener('log', function () { _gaq.push(['_trackEvent'].concat(Array.prototype.slice.call(arguments, 0, 3))); });
		activityLog.addEventListener('error', function (message) {
			jotForm.sendError(message, activityLog.getLog());
		});
		mapModel.addEventListener('analytic', activityLog.log);
	},
		loadScriptsAsynchronously = function (d, s, urls) {
			urls.forEach(function (url) {
				var js, fjs = d.getElementsByTagName(s)[0];
				js = d.createElement(s);
				js.src = (document.location.protocol === 'file:' ? 'http:' : '') + url;
				fjs.parentNode.insertBefore(js, fjs);
			});
		},
		isTouch = function () {
			return jQuery('body').hasClass('ios') || jQuery('body').hasClass('android');
		};
	window._gaq = [['_setAccount', config.googleAnalyticsAccount], ['_trackPageview']];
	jQuery(function () {
		var activityLog = new MM.ActivityLog(10000), oldShowPalette,
			alert = new MM.Alert(),
			jotForm = new MM.JotForm(jQuery('#modalFeedback form'), alert),
			s3Adapter = new MM.S3Adapter(config.s3Url, config.s3Folder, activityLog, config.networkTimeoutMillis),
			googleDriveAdapter = new MM.GoogleDriveAdapter(config.googleClientId, config.googleShortenerApiKey, config.networkTimeoutMillis, 'application/json'),
			offlineMapStorage = new MM.OfflineMapStorage(MM.jsonStorage(localStorage), 'offline'),
			offlineAdapter = new MM.OfflineAdapter(offlineMapStorage),
			mapRepository = new MM.MapRepository(activityLog, alert, [s3Adapter, googleDriveAdapter, offlineAdapter]),
			pngExporter = new MAPJS.PNGExporter(mapRepository),
			mapModel = new MAPJS.MapModel(mapRepository,
				MAPJS.KineticMediator.layoutCalculator,
				['I have a cunning plan...', 'We\'ll be famous...', 'Lancelot, Galahad, and I wait until nightfall, and then leap out of the rabbit, taking the French by surprise'],
				['Luke, I AM your father!', 'Who\'s your daddy?', 'I\'m not a doctor, but I play one on TV', 'Press Space or double-click to edit']),
			mapBookmarks = new MM.Bookmark(mapRepository, MM.jsonStorage(localStorage), 'created-maps');
		MM.OfflineMapStorageBookmarks(offlineMapStorage, mapBookmarks);
		jQuery.support.cors = true;
		setupTracking(activityLog, jotForm, mapModel);
		jQuery('body').classCachingWidget('cached-classes', localStorage);
		if (!jQuery('body').hasClass('image-render-checked')) {
			if (isTouch() || jQuery('body').hasClass('gecko')) {
				jQuery('body').addClass('image-render');
			}
			jQuery('body').addClass('image-render-checked');
		}
		jQuery('#container').mapWidget(activityLog, mapModel, isTouch(), jQuery('body').hasClass('image-render'));
		jQuery('#welcome_message[data-message]').welcomeMessageWidget(activityLog);
		jQuery('#topbar').alertWidget(alert).mapToolbarWidget(mapModel);
		jQuery('#topbar .updateStyle').colorPicker();
		jQuery('#topbar .colorPicker-picker').parent('a').click(function (e) { if (e.target === this) {jQuery(this).find('.colorPicker-picker').click(); } });
		jQuery('.colorPicker-palette').addClass('topbar-color-picker');
		oldShowPalette = jQuery.fn.colorPicker.showPalette;
		jQuery.fn.colorPicker.showPalette = function (palette) {
			oldShowPalette(palette);
			if (palette.hasClass('topbar-color-picker')) {
				palette.css('top', jQuery('#topbar').outerHeight());
			}
		};
		jQuery('#modalFeedback').feedbackWidget(jotForm, activityLog);
		jQuery('#modalVote').voteWidget(activityLog, alert);
		jQuery('#toolbarEdit .updateStyle').colorPicker();
		jQuery('#toolbarEdit .colorPicker-picker').parent('button').click(function (e) { if (e.target === this) {jQuery(this).find('.colorPicker-picker').click(); } });
		jQuery('#toolbarEdit').mapToolbarWidget(mapModel);
		jQuery('#floating-toolbar').floatingToolbarWidget(mapRepository, pngExporter);
		jQuery('#listBookmarks').bookmarkWidget(mapBookmarks, alert, !isTouch());
		jQuery('#modalDownload').downloadWidget(pngExporter);
		if (!isTouch()) {
			jQuery('[rel=tooltip]').tooltip();
		}
		jQuery('[data-category]').trackingWidget(activityLog);
		jQuery(document).titleUpdateWidget(mapRepository);
		jQuery('[data-mm-role=share]').shareWidget();
		jQuery('#modalShareEmail').shareEmailWidget();
		jQuery('[data-mm-role=share]').add('[data-mm-role=short-url]').urlShortenerWidget(config.googleShortenerApiKey, activityLog);
		jQuery('#modalImport').importWidget(activityLog, mapRepository);
		jQuery('[data-mm-role=save]').saveWidget(mapRepository);
		jQuery('[data-mm-role="png-export"]').click(pngExporter.exportMap);
		jQuery('[data-mm-role="toggle-class"]').toggleClassWidget();
		jQuery('[data-mm-role="remote-export"]').remoteExportWidget(mapRepository);
		jQuery('#modalGoogleOpen').googleDriveOpenWidget(googleDriveAdapter);
		jQuery('#modalLocalStorageOpen').localStorageOpenWidget(offlineMapStorage);
		jQuery('body').commandLineWidget('Shift+Space Ctrl+Space', mapModel);
		jQuery('#modalAttachmentEditor').attachmentEditorWidget(mapModel, isTouch());
		mapRepository.loadMap(config.mapId);
	});
	loadScriptsAsynchronously(document, 'script', config.scriptsToLoadAsynchronously);
};
