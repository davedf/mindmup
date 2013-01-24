/*global jQuery, MM, observable*/
/*jslint es5: true*/
MM.Alert = function () {
	'use strict';
	observable(this);
	this.show = this.dispatchEvent.bind(this, 'shown');
	this.hide = this.dispatchEvent.bind(this, 'hidden');
};
jQuery.fn.alertWidget = function (alert) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this);
		alert.addEventListener('shown', function (message, detail, type) {
			type = type || 'info';
			detail = detail || '';
			element.append(
				'<div class="alert fade in alert-' + type + '">\
					<button type="button" class="close" data-dismiss="alert">&#215;</button>\
					<strong>' + message + '</strong>\
					&nbsp;' + detail +
					'</div>'
			);
		});
		alert.addEventListener('hidden', function () {
			element.find('.alert').remove();
		});
	});
};
