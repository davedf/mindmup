/*global $*/
$.fn.attachmentEditorWidget = function (mapModel) {
	'use strict';
	var element = this,
		editorArea = element.find('[data-mm-role=editor]').wysiwyg(),
		ideaId,
		save = function () {
			element.modal('hide');
			mapModel.setAttachment('attachmentEditorWidget', ideaId, {contentType: 'text/html', content: editorArea.cleanHtml() });
			editorArea.html('');
		},
		open = function (activeIdea, attachment) {
			var contentType = attachment && attachment.contentType;
			ideaId = activeIdea;
			if (!contentType || contentType === 'text/html') {
				editorArea.html(attachment && attachment.content);
				element.modal('show');
			}
		};
	element.find('[data-mm-role=save]').click(save);
	element.on('shown', function () {
		editorArea.focus();
	});
	editorArea.keydown('esc', function () {
		element.modal('hide');
	}).keydown('ctrl+return meta+return ctrl+s meta+s', function (e) {
		save();
		e.preventDefault();
	});
	mapModel.addEventListener('attachmentOpened', open);
	return element;
};
