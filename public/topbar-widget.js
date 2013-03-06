/*global $, content*/
$(document).on('touchstart.dropdown.data-api', '.dropdown-submenu > a', function (event) {
		event.preventDefault();
	});
$.fn.topbarWidget = function () {
	'use strict';
	var element = this;
	element.on('touchstart.dropdown.data-api', '.dropdown-submenu > a', function (event) {
		event.preventDefault();
	});
	return element;
};
