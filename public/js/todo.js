/*global jQuery*/
jQuery.fn.todo = function (activityLog) {
	'use strict';
	return this.each(function () {
		var welcomeMessage = jQuery('#welcome_message').data('message');
		if (welcomeMessage) {
			activityLog.log('Welcome Message', welcomeMessage);
		}
		jQuery("#menuExport a").click(function () {
			activityLog.log('Map', 'Export ' + jQuery(this).text());
		});
		jQuery("#toolbarEdit button").click(function () {
			activityLog.log("Toolbar Click", jQuery(this).attr('data-title'));
		});
	});
};
