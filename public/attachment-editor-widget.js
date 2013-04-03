/*global $*/
/*jslint browser:true */
$.fn.attachmentEditorWidget = function (mapModel) {
	'use strict';
	var element = this,
		editor = element.find('[data-mm-role=editor]'),
		open = function (ideaId, attachment) {
			var contentType = attachment && attachment.contentType,
				save = function () {
					element.modal('hide');
					mapModel.setAttachment('attachmentEditorWidget', ideaId, {contentType: 'text/html', content: editor.val() });
				};
			if (!contentType || contentType === 'text/html') {
				editor.val(attachment && attachment.content);
				element.modal('show');
			}
			element.find('[data-mm-role=save]').click(save);
			element.keydown('return', save);
		};
	element.on('shown', function () {
		editor.focus();
	});
	mapModel.addEventListener('attachmentOpened', open);
	return element;
};
