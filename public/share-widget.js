/*global MM,$,document*/
$.fn.shareWidget = function () {
	'use strict';
	return this.each(function () {
		var self = $(this),
			target = self.attr('data-mm-target');
		self.data('mm-url', document.location.href);
		if (!target) {
			return;
		}
		self.click(function () {
			var title = encodeURIComponent(document.title),
				url = encodeURIComponent(self.data('mm-url'));
			if (target === 'twitter') {
				self.attr('target', '_blank');
				self.attr('href', 'https://twitter.com/intent/tweet?text=' + title +
					'&url=' + url +
					'&source=mindmup.com&related=mindmup&via=mindmup');
				return true;
			}
			if (target === 'facebook') {
				self.attr('target', '_blank');
				self.attr('href', 'https://www.facebook.com/dialog/feed?app_id=621299297886954&' +
					'link=' + url + '&' +
					'name=' + title + '&' +
					'caption=' + encodeURIComponent('Mind map from mindmup.com') + '&' +
					'picture=' + encodeURIComponent('http://mindmup.s3.amazonaws.com/lib/img/logo_256.png') + '&' +
					'description=' + title + '&' +
					'redirect_uri=' + encodeURIComponent('http://www.mindmup.com/fb'));
				return true;
			}
			return false;
		});
	});
};
