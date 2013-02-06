/*global jQuery, MM */
jQuery.fn.downloadWidget = function (pngExporter) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this);
		pngExporter.addEventListener('mapExported', function (url) {
			element.modal('show').find('img').attr('src', url);
		});
	});
};
