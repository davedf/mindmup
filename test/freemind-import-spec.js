/*global MM, jQuery, describe, it, beforeEach, expect*/
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
		expect(MM.freemindImport('<map version="0.7.1"><node ID="1" FOLDED="true" TEXT="A"></node></map>').style).
			toEqual({'collapsed': 'true'});
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
});
