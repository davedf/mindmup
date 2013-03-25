/*global Color, $, describe, it, expect, MM, MAPJS, content, jasmine*/
describe("MM.exportIdeas", function () {
	'use strict';
	it("executes a begin callback, then each callback for for each idea, then end callback and then passes toString results to the callback", function () {
		var aggregate = content({id: 1}),
			calls = [],
			begin = function () { calls.push('begin'); },
			each = function () { calls.push('each'); },
			end = function () { calls.push('end'); },
			contents = function () { calls.push('contents'); return "from contents"; },
			callback = jasmine.createSpy('complete');
		MM.exportIdeas(aggregate, {'each': each, 'begin': begin, 'end': end, 'contents': contents}, callback);
		expect(calls).toEqual(['begin', 'each', 'end', 'contents']);
		expect(callback).toHaveBeenCalledWith('from contents');
	});
	it("executes a callback for each idea, reverse depth-order, from parent to children", function () {
		var aggregate = content({id: 1, ideas: {1: {id: 2, ideas: {7: {id: 3}}}}}),
			calls = [],
			each = function (idea) { calls.push(idea); };
		MM.exportIdeas(aggregate, {'each': each});
		expect(calls[0].id).toBe(1);
		expect(calls[1].id).toBe(2);
		expect(calls[2].id).toBe(3);
	});
	it("passes a level with each callback", function () {
		var aggregate = content({id: 1, ideas: {1: {id: 2, ideas: {1: {id: 3}}}}}),
			each = jasmine.createSpy();
		MM.exportIdeas(aggregate, {'each': each});
		expect(each).toHaveBeenCalledWith(aggregate, 0);
		expect(each).toHaveBeenCalledWith(aggregate.ideas[1], 1);
		expect(each).toHaveBeenCalledWith(aggregate.ideas[1].ideas[1], 2);
	});
	it("sorts children by key, positive first then negative, by absolute value", function () {
		var aggregate = content({id: 1, title: 'root', ideas: {'-100': {title: '-100'}, '-1': {title: '-1'}, '1': {title: '1'}, '100': {title: '100'}}}),
			calls = [],
			each = function (idea) { calls.push(idea.title); };
		MM.exportIdeas(aggregate, {'each': each});
		expect(calls).toEqual(['root', '1', '100', '-1', '-100']);
	});
});
describe("MM.tabSeparatedTextExporter", function () {
	'use strict';
	it("each indents idea with a tab depending on levels and lists the title", function () {
		var tabExporter = new MM.TabSeparatedTextExporter();
		tabExporter.each({title: 'foo'}, 3);
		expect(tabExporter.contents()).toBe("\t\t\tfoo");
	});
	it("separates nodes by a new line", function () {
		var tabExporter = new MM.TabSeparatedTextExporter();
		tabExporter.each({title: 'foo'}, 0);
		tabExporter.each({title: 'bar'}, 0);
		expect(tabExporter.contents()).toBe("foo\nbar");
	});
});
describe("MM.htmlTableExporter", function () {
	'use strict';
	it("creates a table with ideas as rows", function () {
		var htmlExporter = new MM.HtmlTableExporter(),
			results;
		htmlExporter.begin();
		htmlExporter.each({title: 'foo'}, 0);
		htmlExporter.each({title: 'bar'}, 0);
		results = $(htmlExporter.contents());
		expect(results).toBe('table');
		expect(results.find('tr').first().children('td').first().text()).toBe('foo');
		expect(results.find('tr').last().children('td').first().text()).toBe('bar');
	});
	it("indents with colspan if level > 0", function () {
		var htmlExporter = new MM.HtmlTableExporter(),
			cells;
		htmlExporter.begin();
		htmlExporter.each({title: 'foo'}, 4);
		cells = $(htmlExporter.contents()).find('tr').first().children('td');
		expect(cells.length).toBe(2);
		expect(cells.first().text()).toBe('&nbsp;');
		expect(cells.first().attr('colspan')).toEqual('4');
		expect(cells.last().text()).toBe('foo');
	});
	it("sets the background color according to style and a contrast foreground if background style is present", function () {
		/*jslint newcap:true*/
		var htmlExporter = new MM.HtmlTableExporter(),
			cell;
		htmlExporter.begin();
		htmlExporter.each({style: {background: '#FF0000'}}, 0);
		cell = $(htmlExporter.contents()).find('tr').first().children('td').first();
		expect(Color(cell.css('background-color'))).toEqual(Color('#FF0000'));
		expect(Color(cell.css('color'))).toEqual(Color(MAPJS.contrastForeground('#FF0000')));
	});
});
