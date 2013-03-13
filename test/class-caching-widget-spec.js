/*global describe, it, $, window, expect, beforeEach, afterEach*/
describe("Class caching wizard", function () {
	'use strict';
	var underTest;
	beforeEach(function () {
		underTest = $("<span id='testX' class='a b c d'/>").appendTo('body');
	});
	afterEach(function () {
		underTest.remove();
	});
	it("automatically saves all classes from the target element to local storage on window unload", function () {
		var store = {};
		$('#testX').classCachingWidget('cached-classes', store);
		$(window).unload();
		expect(store['cached-classes-#testX']).toBe('a b c d');
	});
	it("automatically adds all classes from local storage to the target element", function () {
		var store = {'cached-classes-#testX': "x y z"};
		$('#testX').classCachingWidget('cached-classes', store);
		expect(underTest.hasClass('x y z')).toBeTruthy();
	});
	it("does nothing when storage is empty", function () {
		var store = {};
		$('#testX').classCachingWidget('cached-classes', store);
		expect(underTest.hasClass('a b c d')).toBeTruthy();
	});
});
