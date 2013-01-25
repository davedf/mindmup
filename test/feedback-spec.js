/*global afterEach, beforeEach, describe, expect, it, jQuery, MM, observable, spyOn, window*/
describe('feedbackWidget', function () {
	'use strict';
	var element, sendFeedbackButton, jotForm, activityLog;
	beforeEach(function () {
		jotForm = observable({
			sendFeedback: jQuery.noop
		});
		activityLog = new MM.ActivityLog(10);
		activityLog.log('Hello');
		element = jQuery('<div display="none"></input></div>').appendTo('body');
		sendFeedbackButton = jQuery('<input type="button" class="sendFeedback">').appendTo(element);
	});
	afterEach(function () {
		element.modal('hide').remove();
	});
	it('should be used as a jQuery plugin', function () {
		var result;

		result = element.feedbackWidget(jotForm, activityLog);

		expect(result).toBe(element);
	});
	it('should hide itself when sendFeedback button is clicked', function () {
		element.feedbackWidget(jotForm, activityLog);
		element.modal('show');

		sendFeedbackButton.click();

		expect(element.is(':visible')).toBe(false);
	});
	it('should invoke sendFeedback method on jotForm when sendFeedback button is clicked', function () {
		spyOn(jotForm, 'sendFeedback');
		element.feedbackWidget(jotForm, activityLog);

		sendFeedbackButton.click();

		expect(jotForm.sendFeedback).toHaveBeenCalledWith(activityLog.getLog());
	});
});
describe('JotForm', function () {
	'use strict';
	var alert, form, oldNavigator;
	beforeEach(function () {
		oldNavigator = window.navigator;
		window.navigator = {
			userAgent: 'User agent'
		};
		alert = new MM.Alert();
		form = jQuery('<form></form>').appendTo('body');
		form.submit = function () {
			return false;
		};
	});
	afterEach(function () {
		window.navigator = oldNavigator;
	});
	it('should submit browser info when sendFeedback invoked', function () {
		var underTest = new MM.JotForm(form, alert);

		underTest.sendFeedback([]);

		expect(form.find('[name=q8_browserInfo]').val()).toBe('User agent');
		expect(form.find('[name=q9_activityLog]').val()).toBe('[]');
		expect(form.find('[name=q10_screenInfo]').val()).toContain('resolution');
		expect(form.find('[name=q11_pageInfo]').val()).toContain('.html');
	});
});