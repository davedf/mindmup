/*global jQuery, navigator, window, MM, observable*/
MM.JotForm = function (formElement, alert) {
	'use strict';
	var nameElement = formElement.find('[name=q1_name]'),
		textAreaElement = formElement.find('textarea'),
		browserInfoElement = jQuery('<input type="hidden" name="q8_browserInfo" />').appendTo(formElement),
		activityLogElement = jQuery('<input type="hidden" name="q9_activityLog" />').appendTo(formElement),
		screenInfoElement = jQuery('<input type="hidden" name="q10_screenInfo" />').appendTo(formElement),
		pageInfoElement = jQuery('<input type="hidden" name="q11_pageInfo" />').appendTo(formElement),
		submitForm = function (log) {
			browserInfoElement.val(navigator.userAgent);
			activityLogElement.val(JSON.stringify(log));
			screenInfoElement.val(JSON.stringify(window.screen) + ' resolution:' + jQuery(window).width() + 'x' + jQuery(window).height());
			pageInfoElement.val(window.location.href);
			formElement.submit();
			textAreaElement.val('');
		};
	this.sendError = function (message, log) {
		textAreaElement.val(message);
		nameElement.val('automated error report');
		submitForm(log);
		nameElement.val('');
	};
	this.sendFeedback = function (log) {
		alert.show('Thank you for your feedback!', 'We\'ll get back to you as soon as possible.');
		submitForm(log);
	};
};
jQuery.fn.feedbackWidget = function (jotForm, activityLog) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this);
		element.find('.sendFeedback').click(function () {
			jotForm.sendFeedback(activityLog.getLog());
			element.modal('hide');
		});
	});
};
