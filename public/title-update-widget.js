/*global jQuery*/
jQuery.fn.titleUpdateWidget = function (mapRepository) {
    'use strict';
	var elements = this;
    mapRepository.addEventListener('mapLoaded', function (content_aggregate) {
        if (elements.prop('title')) {
            elements.prop('title', content_aggregate.title);
        }
        /* share this, until we delete it */
        elements.filter('.st_btn').attr('st_title', content_aggregate.title);
    });
};
