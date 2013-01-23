/*global jQuery, navigator, window, MM*/
MM.Feedback = function (alert, activityLog) {
	'use strict';
	var sendFeedbackForm = function (element) {
		element.find('[name=q11_pageInfo]').val(window.location.href);
		element.find('[name=q8_browserInfo]').val(navigator.userAgent);
		element.find('[name=q9_activityLog]').val(JSON.stringify(activityLog.getLog()));
		element.find('[name=q10_screenInfo]').val(JSON.stringify(window.screen) + ' resolution:' + jQuery(window).width() + 'x' + jQuery(window).height());
		element.find('form').submit();
	};
	this.feedbackOpened = function () {
		activityLog.log('Feedback', 'Open');
	};
	this.sendFeedback = function (element) {
		activityLog.log('Feedback', 'Send');
		sendFeedbackForm(element);
		alert.show('Thank you for your feedback!', 'We\'ll get back to you as soon as possible.');
	};
	this.sendErrorReport = this.sendErrorReport = function (element, message) {
		activityLog.log('Error', message);
		element.find('textarea').val(message);
		element.find('[name=q1_name]').val('automated error report');
		sendFeedbackForm(element);
	};
};
jQuery.fn.feedbackWidget = function (feedback) {
	'use strict';
	this.each(function () {
		var element = jQuery(this);
		element.on('show', function () {
			element.find('textarea').val('');
			feedback.feedbackOpened();
		});
		jQuery('#sendFeedBackBtn').click(function () {
			feedback.sendFeedback(element);
			element.modal('hide');
		});
		return this;
	});
};
