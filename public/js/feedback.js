/*global jQuery, navigator, window, MM, observable*/
var MM = MM || {};
MM.JotForm = function (form, activityLog, alert) {
	'use strict';
	var nameElement = form.find('[name=q1_name]'),
		textArea = form.find('textarea'),
		browserInfoElement = jQuery('<input type="hidden" name="q8_browserInfo" />').appendTo(form),
		activityLogElement = jQuery('<input type="hidden" name="q9_activityLog" />').appendTo(form),
		screenInfoElement = jQuery('<input type="hidden" name="q10_screenInfo" />').appendTo(form),
		pageInfoElement = jQuery('<input type="hidden" name="q11_pageInfo" />').appendTo(form),
		submitForm = function () {
			browserInfoElement.val(navigator.userAgent);
			activityLogElement.val(JSON.stringify(activityLog.getLog()));
			screenInfoElement.val(JSON.stringify(window.screen) + ' resolution:' + jQuery(window).width() + 'x' + jQuery(window).height());
			pageInfoElement.val(window.location.href);
			form.submit();
		};
	activityLog.sendError = function (message) {
		//activityLog.log('Error', message);
		textArea.val(message);
		nameElement.val('automated error report');
		submitForm();
		nameElement.val('');
	};
	this.sendFeedback = function () {
		alert.show('Thank you for your feedback!', 'We\'ll get back to you as soon as possible.');
		submitForm();
	};
	this.wasOpened = function () {
		textArea.val('');
	};
};
jQuery.fn.feedbackWidget = function (jotForm) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this);
		element.on('show', jotForm.wasOpened)
			.find('.sendFeedback').click(function () {
				jotForm.sendFeedback();
				element.modal('hide');
			});
	});
};
