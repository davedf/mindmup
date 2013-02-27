/*global beforeEach, expect, describe, it, jasmine, $ */
describe("Json Upload Widget", function () {
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
		input.json_upload('http://fakeaction/a');
		readDeps();
		expect(parentForm).toBe('form');
		expect(parentForm.prop('enctype')).toBe('multipart/form-data');
		expect(parentForm.prop('method')).toBe('post');
		expect(parentForm.prop('action')).toBe('http://fakeaction/a');
	});
	it("adds a hidden iframe to be the target of the form", function () {
		input.json_upload('/');
		readDeps();
		expect(hiddenFrame.length).toBe(1);
		expect(hiddenFrame.css('display')).toBe('none');
	});
	function fakeUpload(content) {
		readDeps();
		hiddenFrame[0].contentWindow.document.body.innerHTML = content;
		parentForm.submit();
		hiddenFrame.load();
	}
	it("submits the form when the value is changed", function () {
		var called = false;
		input.prop('type', 'hidden').json_upload('/');
		readDeps();
		parentForm.submit(function () { called = true; });
		input.change();
		expect(called).toBeTruthy();
	});
	it("executes the start callback with the selected file name when the form is submitted", function () {
		var spy = jasmine.createSpy('called');
		input.json_upload('/', spy);
		readDeps();
		input.prop('type', 'hidden').val('/testpath/abc.def');
		parentForm.submit();
		expect(spy).toHaveBeenCalledWith('abc.def');
	});
	it("executes the success callback with the parsed JSON body if the result is JSON", function () {
		var spy = jasmine.createSpy('called');
		input.json_upload('/', null, spy);
		fakeUpload('{"a":"b"}');
		expect(spy).toHaveBeenCalledWith({'a' : 'b'});
	});
	it("executes the fail callback with the returned body is not JSON", function () {
		var spy = jasmine.createSpy('called');
		input.json_upload('/', null, null, spy);
		fakeUpload('ab');
		expect(spy).toHaveBeenCalledWith('invalid server response', 'ab');
	});
	it("executes the fail callback with the returned body is JSON containing an error message", function () {
		var spy = jasmine.createSpy('called');
		input.json_upload('/', null, null, spy);
		fakeUpload('{"error":"fake error"}');
		expect(spy).toHaveBeenCalledWith('fake error');
	});
	it("does not execute any callbacks if the frame loads but the form was not submitted - firefox bug check", function () {
		var begin = jasmine.createSpy('begin'),
			success = jasmine.createSpy('success'),
			fail = jasmine.createSpy('fail');
		input.json_upload('/', begin, success, fail);
		readDeps();
		hiddenFrame.load();
		expect(begin).not.toHaveBeenCalled();
		expect(success).not.toHaveBeenCalled();
		expect(fail).not.toHaveBeenCalled();
	});
});
