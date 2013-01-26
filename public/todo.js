/*global jQuery*/
jQuery.fn.todo = function (activityLog) {
	'use strict';
	return this.each(function () {
		var welcomeMessage = jQuery('#welcome_message').data('message');
		if (welcomeMessage) {
			activityLog.log('Welcome Message', welcomeMessage);
		}
	});
};
