/*global jQuery*/
jQuery.fn.welcomeMessageWidget = function (activityLog) {
	'use strict';
	return this.each(function () {
		activityLog.log('Welcome Message', jQuery(this).data('message'));
	});
};
