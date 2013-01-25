/*global jQuery, MM, observable*/
/*jslint es5: true*/
MM.Alert = function () {
	'use strict';
	var self = this, lastId = 0;
	observable(this);
	this.show = function (message, detail, type) {
		lastId += 1;
		self.dispatchEvent('shown', lastId, message, detail, type);
		return lastId;
	};
	this.hide = function (id) {
		self.dispatchEvent('hidden', id);
	};
};
jQuery.fn.alertWidget = function (alert) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this);
		alert.addEventListener('shown', function (id, message, detail, type) {
			type = type || 'info';
			detail = detail || '';
			element.append(
				'<div class="alert fade in alert-' + type + '" id="alert-' + id + '">\
					<button type="button" class="close" data-dismiss="alert">&#215;</button>\
					<strong>' + message + '</strong>\
					&nbsp;' + detail +
					'</div>'
			);
		});
		alert.addEventListener('hidden', function (id) {
			element.find("#alert-" + id).remove();
		});
	});
};
