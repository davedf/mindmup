/*global $, content*/
$.fn.topbarWidget = function () {
	'use strict';
	var element = this;
	element.click(function () {
		var target = $($(this).data('mm-target')),
			targetClass = $(this).data('mm-class');
		if (target.hasClass(targetClass)) {
			target.removeClass(targetClass);
		} else {
			target.addClass(targetClass);
		}
	});
	return element;
};
