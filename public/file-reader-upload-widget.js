/*global $, FileReader */
$.fn.file_reader_upload = function (start, complete, fail) {
    'use strict';
    var element = this,
		oFReader = new FileReader(),
		fileName,
		fileType;
	start = start || function (name) { console.log("Reading", name); };
	complete = complete || function (content) { console.log("Read", content); };
	fail = fail || function (error) { console.log("Read error", error); };
	oFReader.onload = function (oFREvent) {
		complete(oFREvent.target.result, fileType);
	};
	oFReader.onerror = function (oFREvent) {
		fail("Error reading file", oFREvent);
	};
	oFReader.onloadstart = function (oFREvent) {
		start(fileName);
	};
	element.change(function () {
		var fileInfo = this.files[0];
		fileName = fileInfo.name;
		fileType = fileName.split('.').pop();
		if (fileType !== 'mm' && fileType !== 'mup') {
			fail("unsupported format " + fileType);
			return;
		}
		oFReader.readAsText(fileInfo, "UTF-8");
	});
    return element;
}
