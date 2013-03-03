/*global $ */
$.fn.json_upload = function (action, start, complete, fail) {
    'use strict';
    var element = this,
        sequence = $('iframe').length,
		active = false;

	start = start || function (name) { console.log("Uploading", name); };
	complete = complete || function (content) { console.log("Uploaded", content); };
	fail = fail || function (error) { console.log("Upload error", error); };

    $('<iframe style="display:none" name="upload-' + sequence + '"></iframe>').appendTo('body').load(
		function () {
			var result;
			if (!active) {
				return;
			}
			active = false;
			try {
				result = this.contentWindow.document.body.innerText;
			} catch (err) {
				fail("problem uploading the file to server", result);
				return;
			}
			try {
				result = JSON.parse(result);
			} catch (err2) {
				fail("invalid server response", result);
				return;
			}
			if (result.error) {
				fail(result.error);
			} else {
				complete(result);
			}
		}
	);
    element.wrap('<form enctype="multipart/form-data" method="post" action="' + action + '" target="upload-' + sequence + '">');
    element.parents('form').submit(
		function () {
			active = true;
			start((element.val() || '').replace(/.*[\\\/]/g, ''));
		}
	);
	element.change(function () {
        element.parents('form').submit();
    });
    return element;
}
