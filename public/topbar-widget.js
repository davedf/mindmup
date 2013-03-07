/*global $, content*/
$.fn.topbarWidget = function (target) {
	'use strict';
	var element = this;
	element.find('[data-mm-role=open-toolbar]').click(function () {
		target.removeClass('collapsed-toolbar');
	});
	return element;
};
