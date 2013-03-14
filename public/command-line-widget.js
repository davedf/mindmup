/*global $, window, Color */
$.fn.commandLineWidget = function (keyBinding, mapModel) {
	'use strict';
	var element = this;
	element.keyup(keyBinding, function () {
		var input,
			valid = function (color, name) {
				name = name.toUpperCase();
				return color &&
						(color.hexString().toUpperCase() === name.toUpperCase() ||
						(color.keyword() && color.keyword().toUpperCase() === name.toUpperCase()));
			},
			hide = function () {
				if (input) {
					input.remove();
				}
				mapModel.setInputEnabled(true);
			},
			commit = function () {
				/*jslint newcap:true*/
				var value = input && input.val(),
					color = value && Color(value);
				if (valid(color, value)) {
					mapModel.updateStyle('cmdline', 'background', color.hexString());
				}
				hide();
			};
		mapModel.setInputEnabled(false);
		input  = $('<input type="text" placeholder="Type a color name or hex…">')
			.css('position', 'absolute')
			.css('z-index', '9999')
			.appendTo(element)
			.css('top', '50%')
			.css('left', '40%')
			.focus()
			.blur(hide)
			.keyup("Esc", hide)
			.keyup("return", commit);
	});
	return element;
}
