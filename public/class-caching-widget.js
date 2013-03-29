/*global $, window*/
$.fn.classCachingWidget = function (keyPrefix, store) {
	'use strict';
	var element = this,
		key = keyPrefix + "-" + element.selector;
	$(window).unload(function () {
		store[key] = element.attr('class');
	});
	element.addClass(store[key]);
	return this;
}
