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
			},
			simulateTouch = function (touchType, hammerEvent) {
				var center;
				if (!hammerEvent.gesture) {
					return; // not a hammer event, instead simulated doubleclick
				}
				center = hammerEvent.gesture.center;
				stage.simulate(touchType, {
					offsetX: center.pageX - element.offset().left,
					offsetY: center.pageY - element.offset().top
				});
			};
		activityLog.log('Creating canvas Size ' + element.width() + ' ' + element.height());
		setStageDimensions();
		stage.attrs.x = 0.5 * stage.getWidth();
		stage.attrs.y = 0.5 * stage.getHeight();
		//stage.attrs.y = Math.max(-minY + $('#topbar').outerHeight() + 5, 0.5 * stage.getHeight());
		jQuery(window).resize(setStageDimensions);
		jQuery('.modal')
			.on('show', mapModel.setInputEnabled.bind(mapModel, false))
			.on('hidden', mapModel.setInputEnabled.bind(mapModel, true));
		element.hammer().on("pinch", function (event) {
			mapModel.scale('touch', event.gesture.scale);
		}).on("swipe", function (event) {
			mapModel.move('touch', event.gesture.deltaX, event.gesture.deltaY);
		}).on("doubletap", function (event) {
			simulateTouch("dbltap", event);
		});
	});
};
