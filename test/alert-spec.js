/*global beforeEach, describe, expect, it, jasmine, jQuery, spyOn, MM*/
describe('alert', function () {
	'use strict';
	var alert;
	beforeEach(function () {
		alert = new MM.Alert();
	});
	it('should return a unique alert id each time show method is invoked', function () {
		var result;

		result = alert.show('Thanks for voting', 'We\'ll do our best to roll popular features out quickly', 'success');
		expect(result).toBe(1);

		result = alert.show('Thanks for voting', 'We\'ll do our best to roll popular features out quickly', 'success');
		expect(result).toBe(2);
	});
	it('should dispatch shown event when show method is invoked', function () {
		var listener = jasmine.createSpy();
		alert.addEventListener('shown', listener);

		alert.show('Thanks for voting', 'We\'ll do our best to roll popular features out quickly', 'success');

		expect(listener).toHaveBeenCalledWith(1, 'Thanks for voting', 'We\'ll do our best to roll popular features out quickly', 'success');
	});
	it('should dispatch hidden event when hide method is invoked', function () {
		var listener = jasmine.createSpy();
		alert.addEventListener('hidden', listener);

		alert.hide(23);

		expect(listener).toHaveBeenCalledWith(23);
	});
});
describe('alertWidget', function () {
	'use strict';
	var alert, element;
	beforeEach(function () {
		alert = new MM.Alert();
		element = jQuery('<div class="navbar navbar-fixed-top navbar"></div>').appendTo('body');
	});
	it('should be used as a jQuery plugin', function () {
		var result;

		result = element.alertWidget(alert);

		expect(result).toBe(element);
	});

	it('should show alert when shown event is dispatched by the alert model', function () {
		element.alertWidget(alert);

		alert.dispatchEvent('shown', 123, 'Message 123', 'Detail 123', 'success');

		expect(element.find('.alert :contains("Message 123")').length).toBe(1);
	});

	it('should hide alert when hidden event is dispatched by the alert model', function () {
		element.alertWidget(alert);
		alert.dispatchEvent('shown', 124, 'Message 124', 'Detail 124', 'success');

		alert.dispatchEvent('hidden', 124);

		expect(element.find('.alert :contains("Message 124")').length).toBe(0);
	});

	it('should not hide alerts other than one specified when hidden event is dispatched by the alert model', function () {
		element.alertWidget(alert);
		alert.dispatchEvent('shown', 125, 'Message 125', 'Detail 125', 'success');
		alert.dispatchEvent('shown', 126, 'Message 127', 'Detail 126', 'success');

		alert.dispatchEvent('hidden', 126);

		expect(element.find('.alert :contains("Message 125")').length).toBe(1);
	});
});