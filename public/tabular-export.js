/*global MM, MAPJS, _, $*/
MM.exportIdeas = function (contentAggregate, exporter, completeCallback) {
	'use strict';
	var traverse = function (iterator, idea, level) {
		level = level || 0;
		iterator(idea, level);
		if (idea.ideas) {
			var childKeys = _.groupBy(_.map(_.keys(idea.ideas), parseFloat), function (key) { return key > 0; }),
				sortedChildKeys = _.sortBy(childKeys[true], Math.abs).concat(_.sortBy(childKeys[false], Math.abs));
			_.each(sortedChildKeys, function (key) {
				traverse(iterator, idea.ideas[key], level + 1);
			});

		}
	};
	if (exporter.begin) { exporter.begin(); }
	traverse(exporter.each, contentAggregate);
	if (exporter.end) { exporter.end(); }
	if (completeCallback) { completeCallback(exporter.contents()); }
};
MM.TabSeparatedTextExporter = function () {
	'use strict';
	var contents = [];
	this.contents = function () {
		return contents.join("\n");
	};
	this.each = function (idea, level) {
		contents.push(
			_.map(_.range(level), function () {return '\t'; }).join("") + idea.title
		);
	};
};
MM.HtmlTableExporter = function () {
	'use strict';
	var result;
	this.begin = function () {
		result = $("<table>");
	};
	this.contents = function () {
		return result;
	};
	this.each = function (idea, level) {
		var row = $("<tr>").appendTo(result),
			cell = $("<td>").appendTo(row).text(idea.title);
		if (idea.style && idea.style.background) {
			cell.css('background-color', idea.style.background);
			cell.css('color', MAPJS.contrastForeground(idea.style.background));
		}
		if (level > 0) {
			$("<td>").prependTo(row).text("&nbsp;").attr('colspan', level);
		}
	};
};
