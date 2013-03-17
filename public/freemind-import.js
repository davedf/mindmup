/*global MM, $, _*/
MM.freemindImport = function (xml) {
	'use strict';
	var xmlToJson = function (xml_node) {
		var node = $(xml_node),
			result = {"title" : node.attr("TEXT") },
			childNodes = node.children('node'),
			children = _.map(childNodes, xmlToJson),
			child_obj = {},
			style = {},
			index = 1;
		if (node.attr("BACKGROUND_COLOR")) {
			style.background = node.attr("BACKGROUND_COLOR");
		}
		if (node.attr("FOLDED") === "true") {
			style.collapsed = 'true';
		}
		if (_.size(style) > 0) {
			result.style = style;
		}
		if (children.length > 0) {
			_.each(children, function (child) {
				var position = $(childNodes[index - 1]).attr('POSITION') === 'left' ? -1 : 1;
				child_obj[position * index] = child;
				index += 1;
			});
			result.ideas = child_obj;
		}
		return result;
	},
		xmlDoc = $.parseXML(xml);
	return xmlToJson($(xmlDoc).find('map').children('node').first());
}
