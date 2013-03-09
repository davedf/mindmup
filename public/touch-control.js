/*global $ */
$.fn.touchControl = function (mapModel) {
	'use strict';
	this.hammer().on("pinch", function (event) {
		mapModel.scale('touch', event.gesture.scale);
	});
	return this;
}
