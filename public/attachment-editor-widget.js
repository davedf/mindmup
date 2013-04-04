/*global $*/
$.fn.attachmentEditorWidget = function (mapModel) {
	'use strict';
	var element = this,
		editorArea = element.find('[data-mm-role=editor]'),
		cleditor = editorArea.cleditor({controls: 'font size ' +
                    'style | bold italic underline strikethrough | color highlight | bullets numbering | alignleft center alignright justify | ' +
                    'image link unlink', updateTextArea: function (html) {
						return html.replace(/(<br>|\s|<div><br><\/div>|&nbsp;)*$/, '');
                    }})[0],
		ideaId,
		keysBound,
		save = function () {
			element.modal('hide');
			cleditor.updateTextArea();
			mapModel.setAttachment('attachmentEditorWidget', ideaId, {contentType: 'text/html', content: editorArea.val() });
			cleditor.clear();
		},
		open = function (activeIdea, attachment) {
			var contentType = attachment && attachment.contentType;
			ideaId = activeIdea;
			if (!contentType || contentType === 'text/html') {
				editorArea.val(attachment && attachment.content);
				cleditor.updateFrame();
				element.modal('show');
			}
		};
	element.find('[data-mm-role=save]').click(save);
	element.keydown('return', save);
	element.on('shown', function () {
		cleditor.focus();
		var realEditor = $(cleditor.doc);
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
	element.on('hidden', function () {
		if (parent && parent.focus) {
			parent.focus();
		}
	});
	mapModel.addEventListener('attachmentOpened', open);
	return element;
};
