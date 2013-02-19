/*global document, jQuery*/
jQuery.fn.voteWidget = function (activityLog, alert) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this);
		element.on('show', function () {
			element.find('input:checked').attr('checked', false);
			element.find('[name=other]').val('');
		});
		jQuery('#sendVote').click(function () {
			var val = element.find('input:checked').val() || element.find('[name=other]').val();
			if (val) {
				activityLog.log('Feature Vote', val);
				alert.show('Thanks for voting', 'We\'ll do our best to roll popular features out quickly', 'success');
			} else {
				return false;
			}
		});
		if (document.location.hash === '#vote') {
			element.modal('show');
		}
	});
};
