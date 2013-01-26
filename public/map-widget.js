/*global jQuery, Kinetic, MAPJS, window*/
jQuery.fn.mapWidget = function (activityLog, mapModel) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
			stage = new Kinetic.Stage({
				container: 'container',
				draggable: true
			}),
			mediator = new MAPJS.KineticMediator(mapModel, stage),
			setStageDimensions = function () {
				stage.setWidth(element.width());
				stage.setHeight(element.height());
				stage.draw();
			};
		/*
		initialLayout = MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider),
		minY = _.min(
			initialLayout.nodes,
			function (node) {
				return node.y;
			}
		).y;
		*/
		activityLog.log('Creating canvas Size ' + element.width() + ' ' + element.height());
		setStageDimensions();
		stage.attrs.x = 0.5 * stage.getWidth();
		stage.attrs.y = 0.5 * stage.getHeight();
		//stage.attrs.y = Math.max(-minY + $('#topbar').outerHeight() + 5, 0.5 * stage.getHeight());
		jQuery(window).resize(setStageDimensions);
		jQuery('.modal')
			.on('show', mapModel.setInputEnabled.bind(mapModel, false))
			.on('hidden', mapModel.setInputEnabled.bind(mapModel, true));
	});
};
