/*global jasmine, MM, jQuery, describe, it, beforeEach, expect, content*/
describe("Freemind Import", function () {
	'use strict';
	var complex_xml = '<map version="0.7.1"><node ID="1" TEXT="A">' +
		'<node ID="2" TEXT="B"></node>' +
		'<node ID="3" TEXT="C" POSITION="left"></node>' +
		'</node></map>',
		complex_xml_with_other_stuff = '<map version="0.7.1">' +
		'<node ID="1" TEXT="A"><!-- comment -->' +
		'<node ID="2" TEXT="B"><ignore/></node>' +
		'<node ID="3" TEXT="C" POSITION="left"></node>' +
		'</node></map>',
		complex_json_without_ids = {'title' : 'A', 'ideas' : { 1  : {'title' : 'B'}, '-2'  : {'title' : 'C'}}};
	it('converts single freemind xml into mindmup json, removing IDs', function () {
		expect(MM.freemindImport('<map version="0.7.1"><node ID="1" TEXT="A"></node></map>')).toEqual({'title': 'A'});
	});
	it('converts BACKGROUND_COLOR attribute into background style', function () {
		expect(MM.freemindImport('<map version="0.7.1"><node ID="1" BACKGROUND_COLOR="#cc3300" TEXT="A"></node></map>').style).
			toEqual({'background': '#cc3300'});
	});
	it('converts FOLDED=true attribute into collapsed style', function () {
		expect(MM.freemindImport('<map version="0.7.1"><node ID="1" FOLDED="true" TEXT="A"><node ID="2" TEXT="B"></node></node></map>').style).
			toEqual({'collapsed': 'true'});
	});
	it('ignores FOLDED on leaf nodes', function () {
		expect(MM.freemindImport('<map version="0.7.1"><node ID="1" FOLDED="true" TEXT="A"></node></map>').style).
			toEqual({});
	});
	it('ignores FOLDED=false', function () {
		expect(MM.freemindImport('<map version="0.7.1"><node ID="1" FOLDED="false" TEXT="A"></node></map>').style).
			toBeUndefined();
	});
	it('converts freemind xml with multilevel child nodes into mindmup json, using left-right positions for absolute ranks', function () {
		expect(MM.freemindImport(complex_xml)).toEqual(complex_json_without_ids);
	});
	it('ignores any non-node tags in XML', function () {
		expect(MM.freemindImport(complex_xml_with_other_stuff)).toEqual(complex_json_without_ids);
	});
	it('converts xml entities into string equivalents while parsing xml', function () {
		expect(MM.freemindImport('<map version="0.7.1"><node ID="1" TEXT="Text&quot;&lt;&gt;&quot;&lt;&gt;More"></node></map>')).toEqual({'title' : 'Text"<>"<>More'});
	});

	it('collapses non-leaf children of collapsed nodes', function () {
		var result = MM.freemindImport('<map version="0.7.1">' +
			'<node ID="1" TEXT="A" FOLDED="true">' +
			'<node ID="2" TEXT="B">' +
			'<node ID="3" TEXT="C" FOLDED="true"></node>' +
			'</node></node></map>');
		expect(result.style.collapsed).toBeTruthy();
		expect(result.ideas[1].style.collapsed).toBeTruthy();
		expect(result.ideas[1].ideas[1].style.collapsed).toBeFalsy();
	});
	it('reports initial number of nodes and progress through callbacks', function () {
		var start = jasmine.createSpy('start'),
			progress = jasmine.createSpy('progress');
		MM.freemindImport(complex_xml, start, progress);
		expect(start).toHaveBeenCalledWith(3);
		expect(progress.callCount).toEqual(3);
	});
});
describe("Freemind Export", function () {
	'use strict';
	it('converts a single node map into a MAP/NODE XML element in freemind format', function () {
		var idea = content({id: 1, title: 'Root'});
		expect(MM.freemindExport(idea)).toBe('<map version="0.7.1"><node ID="1" TEXT="Root"></node></map>');
	});
	it('embeds subideas into child nodes', function () {
		var idea = content({id: 1, title: 'A', ideas: {'-1': {id: 2, title: 'B'}, '2': {id: 3, title: 'C'}}});
		expect(MM.freemindExport(idea)).toBe('<map version="0.7.1"><node ID="1" TEXT="A">' + '<node ID="2" TEXT="B"></node>' + '<node ID="3" TEXT="C"></node>' + '</node></map>');
	});
	it('converts non ascii latin into xml entities', function () {

		var idea = content({id: 1, title: 'fr' + String.fromCharCode('0xE9') + 'jap' + String.fromCharCode('0x65E5')});
		expect(MM.freemindExport(idea)).toBe('<map version="0.7.1"><node ID="1" TEXT="fr&#xE9;jap&#x65E5;"></node></map>');
	});
});
