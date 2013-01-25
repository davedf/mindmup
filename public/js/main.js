/*global _gaq, console, jQuery, MM, MAPJS, window*/
jQuery(function () {
	'use strict';
	var activityLog = new MM.ActivityLog(10000),
		alert = new MM.Alert(),
		jotForm = new MM.JotForm(jQuery('#modalFeedback form'), alert),
		mapRepository = new MM.MapRepository(activityLog, alert),
		mapModel = new MAPJS.MapModel(
			function layoutCalculator(idea) {
				return MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider);
			},
			['A brilliant idea...', 'A cunning plan...', 'We\'ll be famous...', 'Lancelot, Galahad, and I wait until nightfall, and then leap out of the rabbit, taking the French by surprise']
		),
		container;
	window.onerror = activityLog.error;
	activityLog.addEventListener('log', function () {
		var args = ['_trackEvent'].concat(Array.prototype.slice.apply(arguments));
		if (_gaq) {
			_gaq.push(args);
		} else {
			console.log(args);
		}
	});
	activityLog.addEventListener('error', function (message) {
		jotForm.sendError(message, activityLog.getLog());
	});
	mapModel.addEventListener('analytic', activityLog.log);
	jQuery('[data-category]').trackingWidget(activityLog);
	jQuery('#toolbarEdit').mapToolbarWidget(mapModel);
	jQuery('#topbar').alertWidget(alert);
	jQuery('#modalFeedback').feedbackWidget(jotForm, activityLog);
	jQuery('#modalVote').voteWidget(activityLog, alert);
	jQuery('[rel=tooltip]').tooltip();
	jQuery('#floating-toolbar').floatingToolbarWidget(mapRepository);
	jQuery('body').todo(activityLog);//TODO - move this into sensible, generic 'trackingBehaviour'
	container = jQuery('#container');
	container.mapWidget(activityLog, mapModel);
	mapRepository.loadMap(
		container.attr('mindmap'),
		container.attr('mapid'),
		mapModel.setIdea
	);
});
//mapWidget - initial stage y???
