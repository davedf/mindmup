/*global $ */
$.fn.json_upload = function (action, start, complete, fail) {
    'use strict';
    var element = this,
        sequence = $('iframe').length;

	start = start || function (name) { console.log("Uploading", name); };
	complete = complete || function (content) { console.log("Uploaded", content); };
	fail = fail || function (error) { console.log("Upload error", error); };

    $('<iframe style="display:none" name="upload-' + sequence + '"></iframe>').appendTo('body').load(
		function () {
			var result;
			try {
				result = this.contentWindow.document.body.innerHTML;
			} catch (err) {
				fail("problem uploading the file to server", result);
				return;
			}
			try {
				result = JSON.parse(result);
				if (result.error) {
					fail(result.error);
				} else {
					complete(result);
				}
			} catch (err2) {
				console.log(err2, err2.stack);
				fail("invalid server response", result);
			}
		}
	);
    element.wrap('<form enctype="multipart/form-data" method="post" action="' + action + '" target="upload-' + sequence + '">');
    element.parents('form').submit(
		function () {
			start((element.val() || '').replace(/.*[\\\/]/g, ''));
		}
	);
	element.change(function () {
        element.parents('form').submit();
    });
    return element;
}
