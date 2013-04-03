/*global $*/
/*jslint browser:true */
$.fn.attachmentEditorWidget = function (mapModel) {
	'use strict';
	var element = this,
		editorArea = element.find('[data-mm-role=editor]'),
		wysiOptions = {image: false},
		wysiEditor = editorArea.wysihtml5(wysiOptions).data('wysihtml5'),
		ideaId,
		keysBound,
		save = function () {
			element.modal('hide');
			mapModel.setAttachment('attachmentEditorWidget', ideaId, {contentType: 'text/html', content: wysiEditor.editor.getValue() });
		},
		open = function (activeIdea, attachment) {
			var contentType = attachment && attachment.contentType;
			ideaId = activeIdea;
			if (!contentType || contentType === 'text/html') {
				wysiEditor.editor.setValue(attachment && attachment.content);
				element.modal('show');
			}
		};
	element.find('[data-mm-role=save]').click(save);
	element.keydown('return', save);
	element.on('shown', function () {
		var realEditor = $('.wysihtml5-editor', $('.wysihtml5-sandbox')[0].contentDocument);
		realEditor.focus();
		if (!keysBound) {
			realEditor.keydown('esc', function () {
				element.modal('hide');
			}).keydown('ctrl+s meta+s', function (e) {
				save();
				e.preventDefault();
			});
			keysBound = true;
		}
	});

	mapModel.addEventListener('attachmentOpened', open);
	return element;
};
