/*global afterEach, beforeEach, describe, expect, it, jQuery, MM, observable, spyOn*/
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
	it('should ', function () {

	});
});