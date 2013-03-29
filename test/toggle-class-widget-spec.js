/*global jQuery, beforeEach, afterEach, $, describe, it, expect */
describe("toggle-class-widget", function () {
	'use strict';
	var link,
		className = 'cls',
		target,
		nonChanged;
	beforeEach(function () {
		link = $('<a data-mm-role="toggle-class" data-mm-class="cls" data-mm-target="#tgt">x</a>');
		target = $('<span>').attr('id', 'tgt').appendTo('body');
		nonChanged = $('<span>').attr('id', 'tgt2').appendTo('body');
		link.toggleClassWidget();
	});
	afterEach(function () {
		target.remove();
		nonChanged.remove();
	});
	it('removes target class only from target element when clicked if class present', function () {
		target.addClass(className);
		nonChanged.addClass(className);
		link.click();
		expect(target.hasClass(className)).toBeFalsy();
		expect(nonChanged.hasClass(className)).toBeTruthy();
	});
	it('adds target class to target element when clicked if class not present', function () {
		link.click();
		expect(target.hasClass(className)).toBeTruthy();
		expect(nonChanged.hasClass(className)).toBeFalsy();
	});
	it('handles multiple classes (whitespace separated)', function () {
		link.data('mm-class','image-disabled image-enabled');
		target.addClass('image-enabled');
		link.click();
		expect(target.hasClass('image-disabled')).toBeTruthy();
		expect(target.hasClass('image-enabled')).toBeFalsy();
	});
});
