/*global jQuery, $, describe, it, expect */
describe("topbar-widget", function () {
	'use strict';
	it('removes collapsed-toolbar class when clicked on open-toolbar', function () {
		var toolbar = $('<span><a data-mm-role="open-toolbar" data-mm-target="#tgt">x</a></span>'),
			target = $('<span>').attr('id', 'tgt').addClass('collapsed-toolbar').appendTo('body');
		toolbar.topbarWidget();
		$('a', toolbar).click();
		expect(target.hasClass('collapsed-toolbar')).toBeFalsy();
	});
});
