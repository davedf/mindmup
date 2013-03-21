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
					color = value && Color(value.toLowerCase());
				hide();
				if (valid(color, value)) {
					mapModel.updateStyle('cmdline', 'background', color.hexString());
				}
			},
			colors = [
				"aliceblue",
				"antiquewhite",
				"aqua",
				"aquamarine",
				"azure",
				"beige",
				"bisque",
				"black",
				"blanchedalmond",
				"blue",
				"blueviolet",
				"brown",
				"burlywood",
				"cadetblue",
				"chartreuse",
				"chocolate",
				"coral",
				"cornflowerblue",
				"cornsilk",
				"crimson",
				"cyan",
				"darkblue",
				"darkcyan",
				"darkgoldenrod",
				"darkgray",
				"darkgreen",
				"darkkhaki",
				"darkmagenta",
				"darkolivegreen",
				"darkorange",
				"darkorchid",
				"darkred",
				"darksalmon",
				"darkseagreen",
				"darkslateblue",
				"darkslategray",
				"darkturquoise",
				"darkviolet",
				"deeppink",
				"deepskyblue",
				"dimgray",
				"dodgerblue",
				"firebrick",
				"floralwhite",
				"forestgreen",
				"fuchsia",
				"gainsboro",
				"ghostwhite",
				"gold",
				"goldenrod",
				"gray",
				"green",
				"greenyellow",
				"honeydew",
				"hotpink",
				"indianred",
				"indigo",
				"ivory",
				"khaki",
				"lavender",
				"lavenderblush",
				"lawngreen",
				"lemonchiffon",
				"lightblue",
				"lightcoral",
				"lightcyan",
				"lightgoldenrodyellow",
				"lightgray",            // IE6 breaks on this color
				"lightgreen",
				"lightpink",
				"lightsalmon",
				"lightseagreen",
				"lightskyblue",
				"lightslategray",
				"lightsteelblue",
				"lightyellow",
				"lime",
				"limegreen",
				"linen",
				"magenta",
				"maroon",
				"mediumaquamarine",
				"mediumblue",
				"mediumorchid",
				"mediumpurple",
				"mediumseagreen",
				"mediumslateblue",
				"mediumspringgreen",
				"mediumturquoise",
				"mediumvioletred",
				"midnightblue",
				"mintcream",
				"mistyrose",
				"moccasin",
				"navajowhite",
				"navy",
				"oldlace",
				"olive",
				"olivedrab",
				"orange",
				"orangered",
				"orchid",
				"palegoldenrod",
				"palegreen",
				"paleturquoise",
				"palevioletred",
				"papayawhip",
				"peachpuff",
				"peru",
				"pink",
				"plum",
				"powderblue",
				"purple",
				"red",
				"rosybrown",
				"royalblue",
				"saddlebrown",
				"salmon",
				"sandybrown",
				"seagreen",
				"seashell",
				"sienna",
				"silver",
				"skyblue",
				"slateblue",
				"slategray",
				"snow",
				"springgreen",
				"steelblue",
				"tan",
				"teal",
				"thistle",
				"tomato",
				"turquoise",
				"violet",
				"wheat",
				"white",
				"whitesmoke",
				"yellow",
				"yellowgreen"
			];
		mapModel.setInputEnabled(false);
		input  = $('<input type="text" placeholder="Type a color name or hex…">')
			.css('position', 'absolute')
			.css('z-index', '9999')
			.appendTo(element)
			.css('top', '30%')
			.css('left', '40%')
			.css('width', '20%')
			.css('border-width', '5px')
			.focus()
			.blur(hide)
			.keyup("Esc", hide)
			.change(commit)
			.typeahead({
				source: colors
			});
	});
	return element;
}
