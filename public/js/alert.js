/*global jQuery, observable*/
var MM = MM || {};
MM.Alert = function () {
	'use strict';
	observable(this);
	this.show = this.dispatchEvent.bind(this, 'shown');
};
jQuery.fn.alertWidget = function (alert) {
	'use strict';
	this.each(function () {
		var element = jQuery(this);
		alert.addEventListener('shown', function (message, detail, type) {
			element.append(
				'<div class="alert fade in alert-' + type + '">\
					<button type="button" class="close" data-dismiss="alert">&#215;</button>\
					<strong>' + message + '</strong>\
					&nbsp;' + detail +
				'</div>'
			);
		});
	});
	return this;
};
