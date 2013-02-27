/*jslint nomen: true*/
/*global _, jasmine, observable, beforeEach, describe, expect, it, jasmine, jQuery, spyOn, MM*/
describe("Map Repository", function () {
	'use strict';
	var repo1, repo2, underTest;
	beforeEach(function () {
		var protoRepo = observable(
			{
				recognise: false,
				useable: true,
				recognises: function () {
					return this.recognise;
				},
				use: function (doThis, fail) {
					if (this.useable) {
						doThis();
					} else if (fail) {
						fail();
					}
				},
				loadMap: function (mapId) {
				}
			}
		),
			s = function () {};
		repo1 = _.extend({}, protoRepo);
		repo2 = _.extend({}, protoRepo);
		underTest = new MM.MapRepository({error: s}, {hide: s, show: s}, [repo1, repo2]);
	});
	describe("loadMap", function () {
		it("should check each repository to see if it recognises the mapId", function () {
			spyOn(repo1, 'recognises').andCallThrough();
			spyOn(repo2, 'recognises').andCallThrough();
			underTest.loadMap('foo');
			expect(repo1.recognises).toHaveBeenCalledWith('foo');
			expect(repo2.recognises).toHaveBeenCalledWith('foo');
		});
		it("should use the repository which recognises the mapId", function () {
			repo2.recognise = true;
			repo1.loadMap = jasmine.createSpy('loadMap1');
			repo2.loadMap = jasmine.createSpy('loadMap2');

			underTest.loadMap('foo');

			expect(repo1.loadMap).not.toHaveBeenCalledWith('foo');
			expect(repo2.loadMap).toHaveBeenCalledWith('foo');
		});
		it("should use first repository to load as a fallback option", function () {
			repo1.loadMap = jasmine.createSpy('loadMap');

			underTest.loadMap('foo');

			expect(repo1.loadMap).toHaveBeenCalledWith('foo');
		});
		it("should dispatch mapLoadingFailedEvent if repository not usable", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapLoadingFailed', listener);
			repo1.useable = false;

			underTest.loadMap('foo');

			expect(listener).toHaveBeenCalledWith('foo');
		});
	});
	describe("saveMap", function () {
		it("should use default repository to save", function () {
			repo1.saveMap = jasmine.createSpy('saveMap');

			underTest.publishMap();

			expect(repo1.saveMap).toHaveBeenCalled();
		});
	});
});