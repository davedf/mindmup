/*global _gaq, console, jQuery, MM, window*/
(function () {
	'use strict';
	var alert = new MM.Alert(),
		activityLog = new MM.ActivityLog(10000, _gaq ? _gaq.push.bind(_gaq) : console.log.bind(console));
	jQuery('#topbar').alertWidget(alert);
	jQuery('#modalFeedback').feedbackWidget(alert);

	//todo get rid of this once migrated
	window.logUserActivity = window.logActivity = activityLog.log;
	window.logMapActivity = activityLog.log.bind(activityLog, 'Map');
}());
