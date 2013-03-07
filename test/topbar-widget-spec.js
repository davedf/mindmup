/*global jQuery, $, describe, it, expect */
describe("topbar-widget", function () {
	'use strict';
	it('removes collapsed-toolbar class when clicked on open-toolbar', function () {
		var toolbar = $('<span><a data-mm-role="open-toolbar">x</a></span>'),
			target = $('<span>').addClass('collapsed-toolbar');
		toolbar.topbarWidget(target);
		$('a', toolbar).click();
		expect(target.hasClass('collapsed-toolbar')).toBeFalsy();
	});
});
