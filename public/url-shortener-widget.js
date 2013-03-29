/*global MM,jQuery,document, setTimeout*/
jQuery.fn.urlShortenerWidget = function (googleShortenerApiKey, activityLog) {
	'use strict';
	var list = this,
		shortenerRetriesLeft = 5,
		fireShortener = function () {
			jQuery.ajax({
				type: 'post',
				url: 'https://www.googleapis.com/urlshortener/v1/url?key=' + googleShortenerApiKey,
				dataType: 'json',
				contentType: 'application/json',
				data: '{"longUrl": "' + document.location.href + '"}',
				success: function (result) {
					list.each(function () {
						jQuery(this).data('mm-url', result.id);
					});
					list.filter('[data-mm-role=short-url]').show().val(result.id).
						on('input', function () {
							jQuery(this).val(result.id);
						}).click(function () {
							if (this.setSelectionRange) {
								this.setSelectionRange(0, result.id.length);
							} else {
								this.select();
							}
						});
				},
				error: function (xhr, err, msg) {
					if (shortenerRetriesLeft > 0) {
						shortenerRetriesLeft--;
						setTimeout(fireShortener, 1000);
					} else {
						activityLog.log('Map', 'URL shortener failed', err + " " + msg);
					}
				}
			});
		};
	if (document.location.protocol !== 'file:') {
		fireShortener();
	}
	return list;
};
