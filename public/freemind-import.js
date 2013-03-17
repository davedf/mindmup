/*global MM, $, _*/
MM.freemindImport = function (xml, start, progress) {
	'use strict';
	var nodeStyle = function (node, parentStyle) {
		var style = {};
		if (node.attr("BACKGROUND_COLOR")) {
			style.background = node.attr("BACKGROUND_COLOR");
		}
		if ((parentStyle && parentStyle.collapsed) || node.attr("FOLDED") === "true") {
			style.collapsed = 'true';
		}
		return style;
	},
		xmlToJson = function (xml_node, parentStyle) {
			var node = $(xml_node),
				result = {"title" : node.attr("TEXT") },
				childNodes = node.children('node'),
				style = nodeStyle(node, parentStyle),
				children = _.map(childNodes, function (child) {return xmlToJson(child, style); }),
				child_obj = {},
				index = 1;
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
			} else if (result.style && result.style.collapsed) {
				delete result.style.collapsed;
			}
			if (progress) {
				progress();
			}
			return result;
		},
		xmlDoc = $($.parseXML(xml));
	if (start) {
		start(xmlDoc.find('node').length);
	}
	return xmlToJson(xmlDoc.find('map').children('node').first());
}
