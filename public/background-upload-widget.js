/*global $ */
$.fn.background_upload = function (action, start, complete, fail) {
    'use strict';
    var element = this,
        sequence = $('iframe').length,
		active = false;
	start = start || function (name) { console.log("Uploading", name); };
	complete = complete || function (content) { console.log("Uploaded", content); };
	fail = fail || function (error) { console.log("Upload error", error); };

    $('<iframe style="display:none" name="upload-' + sequence + '"></iframe>').appendTo('body').load(
		function () {
			var result, fileType = active;
			if (!active) {
				return;
			}
			active = false;
			try {
				result = $(this.contentWindow.document.body).text();
			} catch (err) {
				fail("problem uploading the file to server", result);
				return;
			}
			complete(result, fileType);
		}
	);
    element.wrap('<form enctype="multipart/form-data" method="post" action="' + action + '" target="upload-' + sequence + '">');
    element.parents('form').submit(
		function () {
			var name = (element.val() || '').replace(/.*[\\\/]/g, '');
			active = name.split('.').pop();
		    if (active !== 'mm' && active !== 'mup') {
				fail("unsupported type " + active);
				active = false;
				return false;
			}
			start(name);
		}
	);
	element.change(function () {
        element.parents('form').submit();
    });
    return element;
}
