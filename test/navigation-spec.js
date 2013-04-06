/*global beforeEach, describe, expect, it, MM, $, spyOn, jasmine*/
describe('MM.navigation', function () {
	'use strict';
	var underTest;
	beforeEach(function () {
		underTest = new MM.navigation({mapId: 'mapIdInConfig'});
	});
	describe('currentMapId', function () {
		it('should return mapId from window address hash', function () {
			window.location.hash = 'mapIdInHash';
			expect(underTest.currentMapId()).toBe('mapIdInHash');
		});
		it('should return mapId from config if there is no window address hash', function () {
			window.location.hash = '';
			expect(underTest.currentMapId()).toBe('mapIdInConfig');
		});
	});
	describe('wireLinkForMapId', function () {
		var link;
		beforeEach(function () {
			link = $('<a>');
		});
		describe('when mapId is from window address hash', function () {
			beforeEach(function () {
				window.location.hash = 'mapIdInHash';
			});
			it('should set # as href', function () {
				underTest.wireLinkForMapId('newMapId', link);
				expect(link.attr('href')).toBe('#');
			});
			it('should set click event', function () {
				spyOn(link, 'click').andCallThrough();
				underTest.wireLinkForMapId('newMapId', link);
				expect(link.click).toHaveBeenCalledWith(jasmine.any(Function));
			});
			it('should set the link to call changeMapId when it is clicked', function () {
				spyOn(underTest, 'changeMapId');
				underTest.wireLinkForMapId('newMapId', link);
				link.click();
				expect(underTest.changeMapId).toHaveBeenCalledWith('newMapId');
			});
		});
		describe('when there is no window address hash', function () {
			beforeEach(function () {
				window.location.hash = '';
			});
			it('should set /map/newMapId as href', function () {
				underTest.wireLinkForMapId('newMapId', link);
				expect(link.attr('href')).toBe('/map/newMapId');
			});
			it('should not set click event', function () {
				spyOn(link, 'click').andCallThrough();
				underTest.wireLinkForMapId('newMapId', link);
				expect(link.click).not.toHaveBeenCalled();
			});
		});
	});
	describe('changeMapId', function () {
		describe('when mapId is from window address hash', function () {
			var listener;
			beforeEach(function () {
				window.location.hash = 'mapIdInHash';
				listener = jasmine.createSpy();
				underTest.addEventListener('mapIdChanged', listener);
			});
			it('should return true when mapId is not the same', function () {
				expect(underTest.changeMapId('newMapId')).toBe(true);
			});
			it('should set window address hash to new mapId', function () {
				underTest.changeMapId('newMapId');
				expect(window.location.hash).toBe('#newMapId');
			});
			it('should notify listeners of newMapId', function () {
				underTest.changeMapId('newMapId');
				expect(listener).toHaveBeenCalledWith('newMapId');
			});
			it('should return false when mapId is the same', function () {
				expect(underTest.changeMapId('mapIdInHash')).toBe(false);
				expect(window.location.hash).toBe('#mapIdInHash');
				expect(listener).not.toHaveBeenCalled();
			});
		});
		describe('when there is no window address hash', function () {
			beforeEach(function () {
				window.location.hash = '';
			});
			it('should return false when mapId is the same', function () {
				expect(underTest.changeMapId('mapIdInConfig')).toBe(false);
				expect(window.location.hash).toBe('');
			});
		});
	});
});