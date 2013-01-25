/*global afterEach, beforeEach, describe, expect, it, jQuery, observable, spyOn*/
describe('feedbackWidget', function () {
	'use strict';
	var element, sendFeedbackButton, jotForm;
	beforeEach(function () {
		jotForm = observable({
			wasOpened: jQuery.noop,
			sendFeedback: jQuery.noop
		});
		element = jQuery('<div display="none"></input></div>').appendTo('body');
		sendFeedbackButton = jQuery('<input type="button" class="sendFeedback">').appendTo(element);
	});
	afterEach(function () {
		element.modal('hide').remove();
	});
	it('should be used as a jQuery plugin', function () {
		var result;

		result = element.feedbackWidget(jotForm);

		expect(result).toBe(element);
	});
	it('should invoke wasOpened method on jotForm when element becomes visible', function () {
		spyOn(jotForm, 'wasOpened');
		element.feedbackWidget(jotForm);

		element.modal('show');

		expect(jotForm.wasOpened).toHaveBeenCalled();
	});
	it('should hide itself when sendFeedback button is clicked', function () {
		element.feedbackWidget(jotForm);
		element.modal('show');

		sendFeedbackButton.click();

		expect(element.is(':visible')).toBe(false);
	});
	it('should invoke sendFeedback method on jotForm when sendFeedback button is clicked', function () {
		spyOn(jotForm, 'sendFeedback');
		element.feedbackWidget(jotForm);

		sendFeedbackButton.click();

		expect(jotForm.sendFeedback).toHaveBeenCalled();
	});
});
describe('JotForm', function () {
	'use strict';
	it('should ', function () {

	});
});