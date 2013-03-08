/*global MM,jQuery,document*/
jQuery.fn.shareEmailWidget = function () {
	'use strict';
	var shareModal = this,
		formElement = shareModal.find('form'),
		validate = function (element) {
			var valid = element.val();
			if (!valid) {
				element.parents('.control-group').addClass('error');
			} else {
				element.parents('.control-group').removeClass('error');
			}
			return valid;
		},
		submitForm = function () {
			var nameElement = formElement.find('[name=q6_yourName]'),
				emailElement = formElement.find('[name=q3_recipientEmail]'),
				messageElement = formElement.find('[name=q5_message]'),
				pathElement = formElement.find('[name=q4_path]'),
				titleElement = formElement.find('[name=q7_title]');
			if (validate(emailElement) && validate(nameElement) && validate(messageElement)) {
				pathElement.val(shareModal.data('mm-url'));
				titleElement.val(document.title);
				formElement.submit();
				messageElement.val('');
				emailElement.val('');
				shareModal.modal('hide');
			}
		};
	shareModal.detach().appendTo('body').data('mm-url', document.location.href);
	formElement.find('input').blur(function () { validate(jQuery(this)); });
	shareModal.find('[data-mm-role=submit]').click(submitForm);
	return shareModal;
};
