/*global $, content*/
$.fn.topbarWidget = function (target) {
	'use strict';
	var element = this;
	element.find('[data-mm-role=open-toolbar]').click(function () {
		$($(this).data('mm-target')).removeClass('collapsed-toolbar');
	});
	return element;
};
