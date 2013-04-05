/*global $*/
$.fn.attachmentEditorWidget = function (mapModel, isTouch) {
	'use strict';
	var element = this,
		shader = $('<div>').addClass('modal-backdrop fade in hide').appendTo('body'),
		editorArea = element.find('[data-mm-role=editor]').wysiwyg(),
		ideaId,
		close = function () {
			shader.hide();
			mapModel.setInputEnabled(true);
			element.hide();
			editorArea.html('');
		},
		save = function () {
			mapModel.setAttachment('attachmentEditorWidget', ideaId, {contentType: 'text/html', content: editorArea.cleanHtml() });
			close();
		},
		open = function (activeIdea, attachment) {
			var contentType = attachment && attachment.contentType, margin;
			shader.show();
			ideaId = activeIdea;
			if (!contentType || contentType === 'text/html') {
				editorArea.html(attachment && attachment.content);
				element.show();
				margin = editorArea.outerHeight(true) - editorArea.innerHeight();
				editorArea.innerHeight(element.innerHeight() - editorArea.siblings().outerHeight(true) - margin);
				editorArea.focus();
				mapModel.setInputEnabled(false);
			}
		};
	if (isTouch) {
		editorArea.detach().prependTo(element);
	}
	element.find('[data-mm-role=save]').click(save);
	element.find('[data-mm-role=close]').click(close);
	editorArea.keydown('esc', function () {
		close();
	}).keydown('ctrl+return meta+return ctrl+s meta+s', function (e) {
		e.preventDefault();
		save();
	});
	mapModel.addEventListener('attachmentOpened', open);
	return element;
};
