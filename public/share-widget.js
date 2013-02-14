/*global jQuery,document*/
MM.InitShareForm = function (formElement) {
	'use strict';
	if (formElement.data('mm-initialised')) {
		throw new Error ('reinitialisation not allowed');
	}
	function validate(element) {
		var valid = element.val();
		if (!valid) {
			element.parents('.control-group').addClass('error');
		} else {
			element.parents('.control-group').removeClass('error');
		}
		return valid;
	}
	var nameElement = formElement.find('[name=q6_yourName]'),
		emailElement = formElement.find('[name=q3_recipientEmail]'),
		messageElement = formElement.find('[name=q5_message]'),
		pathElement = jQuery('<input type="hidden" name="q4_path" />').appendTo(formElement),
		titleElement = jQuery('<input type="hidden" name="q7_title"/>').appendTo(formElement),
		submitForm = function () {
			if (validate(emailElement) && validate(nameElement) && validate(messageElement)) {
				pathElement.val(document.location.pathname);
				titleElement.val(document.title);
				formElement.submit();
				messageElement.val('');
				emailElement.val('');
				return true;
			} else {
				return false;
			}
		};
	formElement.find('input').blur(function () { validate(jQuery(this)); });
	formElement.data('mm-initialised', 'true');
	return submitForm;
};
jQuery.fn.shareWidget = function (shareModal) {
    'use strict';
	var elements = this, formCallback = MM.InitShareForm(shareModal.find('form'));
	shareModal.find('[data-mm-role=submit]').click(function () {
		if (formCallback()) {
			shareModal.modal('hide');
		}
	});
	elements.click(function () {
		var self = jQuery(this), target = self.attr('data-mm-target'),
			title = encodeURIComponent(document.title), url = encodeURIComponent(document.location.href);

		if (target === 'twitter') {
			self.attr('target', '_blank');
			self.attr('href', 'https://twitter.com/intent/tweet?text=' + title +
				'&url=' + url +
				'&source=mindmup.com&hashtags=mindmup&related=mindmup&via=mindmup');
			return true;
		} else if (target === 'facebook') {
			self.attr('target', '_blank');
			self.attr('href', 'https://www.facebook.com/dialog/feed?app_id=621299297886954&' +
					'link=' + url + '&' +
					'name=' + title + '&' +
					'caption=' + encodeURIComponent('Mind map from mindmup.com') + '&' +
					'picture=' + encodeURIComponent('http://mindmup.s3.amazonaws.com/lib/img/logo_256.png') + '&' +
					'description=' + title + '&' +
					'redirect_uri=' + url);
			return true;
		} else if (target === 'email') {
			shareModal.modal('show');
			return false;
		}
	});
};
