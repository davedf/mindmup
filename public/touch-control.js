/*global $ */
$.fn.touchControl = function (mapModel) {
	'use strict';
	this.hammer().on("pinch", function (event) {
		mapModel.scale('touch', event.gesture.scale);
	});
	this.hammer().on("swipe", function (event) {
		mapModel.move('touch', event.gesture.deltaX, event.gesture.deltaY);
	});
	this.hammer().on("doubletap", function (event) {
		mapModel.move('touch', 'center', 'center');
	});
	return this;
}
