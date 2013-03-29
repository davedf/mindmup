/*global beforeEach, expect, describe, it, jasmine, $ */
describe("Background Upload Widget", function () {
	'use strict';
	var input, parentForm, hiddenFrame;
	beforeEach(function () {
		input = $('<input value="abc.def" type="file" name="file" />').appendTo("body");
	});
	function readDeps() {
		parentForm = input.parent();
		hiddenFrame = $('iframe[name="' + parentForm.prop('target') + '"]');
	}
	it("wraps the file input into a multi-part form", function () {
		input.background_upload('http://fakeaction/a');
		readDeps();
		expect(parentForm).toBe('form');
		expect(parentForm.prop('enctype')).toBe('multipart/form-data');
		expect(parentForm.prop('method')).toBe('post');
		expect(parentForm.prop('action')).toBe('http://fakeaction/a');
	});
	it("adds a hidden iframe to be the target of the form", function () {
		input.background_upload('/');
		readDeps();
		expect(hiddenFrame.length).toBe(1);
		expect(hiddenFrame.css('display')).toBe('none');
	});
	function fakeUpload(content, fname) {
		readDeps();
		input.prop('type', 'hidden').val('/testpath/' + fname);
		hiddenFrame[0].contentWindow.document.body.innerText = content;
		parentForm.submit();
		hiddenFrame.load();
	}
	it("submits the form when the value is changed", function () {
		var called = false;
		input.prop('type', 'hidden').background_upload('/');
		readDeps();
		parentForm.submit(function () { called = true; });
		input.change();
		expect(called).toBeTruthy();
	});
	it("executes the start callback with the selected file name when the form is submitted", function () {
		var spy = jasmine.createSpy('called');
		input.background_upload('/', spy);
		readDeps();
		input.prop('type', 'hidden').val('/testpath/abc.mm');
		parentForm.submit();
		expect(spy).toHaveBeenCalledWith('abc.mm');
	});
	it("executes the success callback with the result body and file type", function () {
		var spy = jasmine.createSpy('called');
		input.background_upload('/', null, spy);
		fakeUpload('somecontent', 'abc.mm');
		expect(spy).toHaveBeenCalledWith('somecontent', 'mm');
	});
	it("executes the fail callback if unsupported type", function () {
		var begin = jasmine.createSpy('begin'),
			success = jasmine.createSpy('success'),
			fail = jasmine.createSpy('fail');
		input.background_upload('/', begin, success, fail);
		fakeUpload('somecontent', 'abc.txt');
		expect(fail).toHaveBeenCalledWith('unsupported type txt');
		expect(begin).not.toHaveBeenCalled();
		expect(success).not.toHaveBeenCalled();
	});
	it("does not execute any callbacks if the frame loads but the form was not submitted - firefox bug check", function () {
		var begin = jasmine.createSpy('begin'),
			success = jasmine.createSpy('success'),
			fail = jasmine.createSpy('fail');
		input.background_upload('/', begin, success, fail);
		readDeps();
		hiddenFrame.load();
		expect(begin).not.toHaveBeenCalled();
		expect(success).not.toHaveBeenCalled();
		expect(fail).not.toHaveBeenCalled();
	});
});
