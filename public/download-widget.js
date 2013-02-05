/*global jQuery, MM */
jQuery.fn.downloadWidget = function (jQueryClickableActivation, anIdea) {
	'use strict';
	var element = this,
		activate = function (url) {
			element.find('img').attr('src', url);
			element.modal('show');
		};
	jQuery(jQueryClickableActivation).imageExportWidget(anIdea, activate);
};
