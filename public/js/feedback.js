/*global jQuery, navigator, window, MM*/
jQuery.fn.feedbackWidget = function (alert) {
	'use strict';
	this.each(function () {
		var element = jQuery(this);
		var sendFeedbackForm = function () {
			element.find('[name=q11_pageInfo]').val(window.location.href);
			element.find('[name=q8_browserInfo]').val(navigator.userAgent);
			element.find('[name=q9_activityLog]').val(JSON.stringify(window._userActivityLog));//todo
			element.find('[name=q10_screenInfo]').val(JSON.stringify(window.screen) + ' resolution:' + $(window).width() + 'x' + $(window).height());
			element.find('form').submit();
		};
		MM.sendErrorReport = function (message) {
			logActivity('Error',message);
			element.find('textarea').val(message);
			element.find('[name=q1_name]').val('automated error report');
			sendFeedbackForm();
		};
		element.on('show', function () {
			logActivity('Feedback', 'Open');
			element.find('textarea').val('');
		});
		$('#sendFeedBackBtn').click(function () {
			logActivity('Feedback', 'Send');
			sendFeedbackForm();
			element.modal('hide');
			alert.show('Thank you for your feedback!', 'We\'ll get back to you as soon as possible.');
		});
		return this;
	});
};
