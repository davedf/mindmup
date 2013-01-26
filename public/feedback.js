/*global jQuery, navigator, window, MM, observable*/
var MM = MM || {};
MM.JotForm = function (form, alert) {
	'use strict';
	var nameElement = form.find('[name=q1_name]'),
		textArea = form.find('textarea'),
		browserInfoElement = jQuery('<input type="hidden" name="q8_browserInfo" />').appendTo(form),
		activityLogElement = jQuery('<input type="hidden" name="q9_activityLog" />').appendTo(form),
		screenInfoElement = jQuery('<input type="hidden" name="q10_screenInfo" />').appendTo(form),
		pageInfoElement = jQuery('<input type="hidden" name="q11_pageInfo" />').appendTo(form),
		submitForm = function (log) {
			browserInfoElement.val(navigator.userAgent);
			activityLogElement.val(JSON.stringify(log));
			screenInfoElement.val(JSON.stringify(window.screen) + ' resolution:' + jQuery(window).width() + 'x' + jQuery(window).height());
			pageInfoElement.val(window.location.href);
			form.submit();
			textArea.val('');
		};
	this.sendError = function (message, log) {
		textArea.val(message);
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
