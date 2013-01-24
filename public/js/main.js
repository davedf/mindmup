/*global _gaq, console, jQuery, MM, MAPJS, window*/
jQuery(function () {
	'use strict';
	var activityLog = new MM.ActivityLog(10000, _gaq ? _gaq.push.bind(_gaq) : console.log.bind(console)),
		alert = new MM.Alert(),
		feedback = new MM.Feedback(activityLog, alert),
		mapRepository = new MM.MapRepository(activityLog, feedback, alert),
		mapModel = new MAPJS.MapModel(
			function layoutCalculator(idea) {
				return MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider);
			},
			['A brilliant idea...', 'A cunning plan...', 'We\'ll be famous...', 'Lancelot, Galahad, and I wait until nightfall, and then leap out of the rabbit, taking the French by surprise']
		),
		container;
	mapModel.addEventListener('analytic', activityLog.log);
	jQuery('#toolbarEdit').mapToolbarWidget(mapModel);
	jQuery('#topbar').alertWidget(alert);
	jQuery('#modalFeedback').feedbackWidget(feedback);
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
//todo widget (tracking behaviour)
//add window.onerror
