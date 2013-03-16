/*global MM, $, _*/
MM.freemindImport = function (xml) {
	'use strict';
	var xmlToJson = function (xml_node) {
		var node = $(xml_node),
			result = {"title" : node.attr("TEXT") },
			children = _.map(node.children('node'), xmlToJson),
			child_obj = {},
			index = 1;
		if (children.length > 0) {
			_.each(children, function (child) { child_obj[index] = child; index += 1; });
			result.ideas = child_obj;
		}
		return result;
	},
		xmlDoc = $.parseXML(xml);
	return xmlToJson($(xmlDoc).find('map').children('node').first());
}
