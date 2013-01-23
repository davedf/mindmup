/*global _gaq, console, jQuery, MM, window*/
(function () {
	'use strict';
	var alert = new MM.Alert(),
		activityLog = new MM.ActivityLog(10000, _gaq ? _gaq.push.bind(_gaq) : console.log.bind(console)),
		feedback = new MM.Feedback(alert, activityLog);

	jQuery('#topbar').alertWidget(alert);
	jQuery('#modalFeedback').feedbackWidget(feedback);

	//todo get rid of this once migrated
	MM.sendErrorReport = feedback.sendErrorReport;
	window.logUserActivity = window.logActivity = activityLog.log;
	window.logMapActivity = activityLog.log.bind(activityLog, 'Map');
}());
