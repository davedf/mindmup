/*global beforeEach, describe, expect, it, MM*/
describe('MM.navigation', function () {
	'use strict';
	var underTest;
	beforeEach(function () {
		underTest = new MM.navigation({mapId: 'mapIdInConfig'});
	});
	it('should return mapId from window address hash', function () {
		window.location.hash = 'mapIdInHash';
		expect(underTest.currentMapId()).toBe('mapIdInHash');
	});
	it('should return mapId from config if there is no window address hash', function () {
		window.location.hash = '';
		expect(underTest.currentMapId()).toBe('mapIdInConfig');
	});
});