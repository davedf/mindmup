/*global beforeEach, describe, expect, it, jasmine, jQuery, spyOn, MM*/
describe('alert', function () {
	'use strict';
	var alert;
	beforeEach(function () {
		alert = new MM.Alert();
	});
	it('should dispatch alertShown event with show method is invoked', function () {
		var listener = jasmine.createSpy();
		alert.addEventListener('shown', listener);

		alert.show('Thanks for voting', 'We\'ll do our best to roll popular features out quickly', 'success');

		expect(listener).toHaveBeenCalledWith(1, 'Thanks for voting', 'We\'ll do our best to roll popular features out quickly', 'success');
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

		alert.dispatchEvent('shown', 1, 'Thanks for voting', 'We\'ll do our best to roll popular features out quickly', 'success');

		expect(element.find('.alert').hasClass('alert-success')).toBe(true);
	});
});