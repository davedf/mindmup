/*global MM,jQuery,document, setTimeout*/
jQuery.fn.urlShortenerWidget = function (googleShortenerApiKey, activityLog) {
	'use strict';
	var element = this,
		shortenerRetriesLeft = 5,
		fireShortener = function () {
			jQuery.ajax({
				type: 'post',
				url: 'https://www.googleapis.com/urlshortener/v1/url?key=' + googleShortenerApiKey,
				dataType: 'json',
				contentType: 'application/json',
				data: '{"longUrl": "' + document.location.href + '"}',
				success: function (result) {
					element.data('mm-url', result.id);
					element.find('[data-mm-role=short-url]').show().val(result.id);
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
	fireShortener();
	return element;
};
