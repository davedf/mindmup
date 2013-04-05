/*global $*/
/*jslint browser:true*/
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
		sizeEditor = function () {
			var margin = editorArea.outerHeight(true) - editorArea.innerHeight();
			editorArea.innerHeight(element.innerHeight() - editorArea.siblings().outerHeight(true) - margin);
		},
		open = function (activeIdea, attachment) {
			var contentType = attachment && attachment.contentType;
			shader.show();
			ideaId = activeIdea;
			if (!contentType || contentType === 'text/html') {
				editorArea.html(attachment && attachment.content);
				element.show();
				sizeEditor();
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
	$(window).bind('orientationchange resize', sizeEditor);
	mapModel.addEventListener('attachmentOpened', open);
	$('[data-role=editor-toolbar] .dropdown-menu input')
		.click(function () {return false; })
		.change(function () {$(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle'); })
		.keydown('esc', function () { this.value = ''; $(this).change(); });
	return element;
};
