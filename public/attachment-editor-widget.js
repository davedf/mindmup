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
		isEditing,
		switchToEditMode = function () {
			editorArea.attr('contenteditable', true);
			element.addClass('mm-editable');
			editorArea.focus();
			isEditing = true;
		},
		switchToViewMode = function () {
			element.removeClass('mm-editable');
			editorArea.attr('contenteditable', false);
			isEditing = false;
			editorArea.focus();
		},
		save = function () {
			var newContent = editorArea.cleanHtml();
			if (newContent) {
				mapModel.setAttachment('attachmentEditorWidget', ideaId, {contentType: 'text/html', content: newContent });
				switchToViewMode();
			} else {
				mapModel.setAttachment('attachmentEditorWidget', ideaId, false);
				close();
			}
		},
		clear = function () {
			editorArea.html('');
		},
		sizeEditor = function () {
			var margin = editorArea.outerHeight(true) - editorArea.innerHeight() + 30;
			editorArea.height(element.innerHeight() - editorArea.siblings().outerHeight(true) - margin);
			$('[data-role=editor-toolbar] [data-role=magic-overlay]').each(function () {
				var overlay = $(this), target = $(overlay.data('target'));
				overlay.css('opacity', 0).css('position', 'absolute').
					offset(target.offset()).width(target.outerWidth()).height(target.outerHeight());
			});
			shader.width('100%').height('100%');
		},

		open = function (activeIdea, attachment) {
			var contentType = attachment && attachment.contentType;
			shader.show();
			ideaId = activeIdea;
			element.show();
			sizeEditor();
			mapModel.setInputEnabled(false);
			if (!attachment) {
				switchToEditMode();
			} else if (contentType === 'text/html') {
				editorArea.html(attachment && attachment.content);
				switchToViewMode();
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
	element.addClass('mm-editable');
	element.find('[data-mm-role=save]').click(save);
	element.find('[data-mm-role=close]').click(close);
	element.find('[data-mm-role=clear]').click(clear);
	element.find('[data-mm-role=edit]').click(switchToEditMode);
	$(document).keydown('esc', function () {
		if (element.is(":visible")) {
			close();
		}
	}).keydown('ctrl+s meta+s', function (e) {
		if (element.is(":visible")) {
			e.preventDefault();
			save();
			close();
		}
	}).keydown('ctrl+return meta+return', function (e) {
		if (element.is(":visible")) {
			if (isEditing) {
				save();
			} else {
				switchToEditMode();
			}
		}
	});
	$(window).bind('orientationchange resize', sizeEditor);
	mapModel.addEventListener('attachmentOpened', open);
	return element;
};
