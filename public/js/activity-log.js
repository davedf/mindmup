/*global jQuery,MM*/
MM.ActivityLog = function (maxNumberOfElements, analyticCallback) {
	'use strict';
	var activityLog = [], nextId = 1;
	this.log = function () {
		var analyticArgs = ['_trackEvent'];
		if (activityLog.length === maxNumberOfElements) {
			activityLog.shift();
		}
		activityLog.push({
			id: nextId,
			ts: new Date(),
			event: Array.prototype.join.call(arguments, ',')
		});
		nextId += 1;
		Array.prototype.slice.call(arguments).forEach(function (element) {
			if (jQuery.isArray(element)) {
				analyticArgs = analyticArgs.concat(element);
			} else {
				analyticArgs.push(element);
			}
		});
		analyticCallback(analyticArgs);
	};
	this.getLog = function () {
		return activityLog;
	};
};
