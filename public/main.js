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
				js.src = url;
				fjs.parentNode.insertBefore(js, fjs);
			});
		};
	window._gaq = [['_setAccount', config.googleAnalyticsAccount], ['_trackPageview']];
	jQuery(function () {
		var activityLog = new MM.ActivityLog(10000),
			alert = new MM.Alert(),
			jotForm = new MM.JotForm(jQuery('#modalFeedback form'), alert),
			mapRepository = new MM.MapRepository(activityLog, alert, config.networkTimeoutMillis),
			mapModel = new MAPJS.MapModel(MAPJS.KineticMediator.layoutCalculator,
				['I have a cunning plan...', 'We\'ll be famous...', 'Lancelot, Galahad, and I wait until nightfall, and then leap out of the rabbit, taking the French by surprise'],
				['Luke, I AM your father!', 'Who\'s your daddy?', 'I\'m not a doctor, but I play one on TV']),
			mapBookmarks = new MM.Bookmark(mapRepository, 10, MM.jsonStorage(localStorage), 'created-maps');
		setupTracking(activityLog, jotForm, mapModel);
		jQuery('#container').mapWidget(activityLog, mapModel);
		jQuery('#welcome_message[data-message]').welcomeMessageWidget(activityLog);
		jQuery('#topbar').alertWidget(alert);
		jQuery('#modalFeedback').feedbackWidget(jotForm, activityLog);
		jQuery('#modalVote').voteWidget(activityLog, alert);
		jQuery('#toolbarEdit').mapToolbarWidget(mapModel);
		jQuery('#floating-toolbar').floatingToolbarWidget(mapRepository);
		jQuery("#listBookmarks").bookmarkWidget(mapBookmarks.links());
		mapRepository.loadMap(config.mapUrl, config.mapId, function (idea) {
			mapModel.setIdea(idea);
			jQuery('#modalDownload').downloadWidget('[data-mm-role="image-export"]', idea);
		});
		jQuery('[data-category]').trackingWidget(activityLog);
		jQuery('[rel=tooltip]').tooltip();
	});
	loadScriptsAsynchronously(document, 'script', config.scriptsToLoadAsynchronously);
};
