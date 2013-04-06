/*global $*/
/*jslint browser:true*/
$.fn.attachmentEditorWidget = function (mapModel, isTouch) {
	'use strict';
	var element = this,
		shader = $('<div>').addClass('modal-backdrop fade in hide').appendTo('body'),
		editorArea = element.find('[data-mm-role=editor]'),
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
			$('[data-role=editor-toolbar] [data-role=magic-overlay]').each(function () {
				var overlay = $(this), target = $(overlay.data('target'));
				overlay.css('opacity', 0).css('position', 'absolute').
					offset(target.offset()).width(target.outerWidth()).height(target.outerHeight());
			});
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
		},
		initToolbar = function () {
			var fonts = ['Serif', 'Sans', 'Arial', 'Arial Black', 'Courier',
				'Courier New', 'Comic Sans MS', 'Helvetica', 'Impact', 'Lucida Grande', 'Lucida Sans', 'Tahoma', 'Times',
				'Times New Roman', 'Verdana'],
				fontTarget = $('[data-role=editor-toolbar] [data-mm-role=font]');
			$.each(fonts, function (idx, fontName) {
				fontTarget.append($('<li><a data-edit="fontName ' + fontName + '" style="font-family:' + fontName + '">' + fontName + '</a></li>'));
			});
			$('[data-role=editor-toolbar] .dropdown-menu input')
				.click(function () {return false; })
				.change(function () {$(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle'); })
				.keydown('esc', function () { this.value = ''; $(this).change(); });
		};
	if (isTouch) {
		editorArea.detach().prependTo(element);
	}
	initToolbar();
	editorArea.wysiwyg();
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
	return element;
};
