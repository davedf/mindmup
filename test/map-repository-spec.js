/*jslint nomen: true*/
/*global _, jasmine, observable, beforeEach, describe, expect, it, jasmine, jQuery, spyOn, MM*/
describe("Map Repository", function () {
	'use strict';
	var repo1, repo2, underTest,
		qstub = function (functions) {
			var ret = {},
				dummy = function () {};
			_.each(functions, function (func) {
				ret[func] = function () {};
			});
			return ret;
		};
	beforeEach(function () {
		var protoRepo = observable(
			{
				useable: true,
				use: function (doThis, fail) {
					if (this.useable) {
						doThis();
					} else if (fail) {
						fail();
					}
				}
			}
		),
			repoActions = ['loadMap', 'saveMap', 'recognises'];
		repo1 = _.extend(qstub(repoActions), protoRepo);
		repo2 = _.extend(qstub(repoActions), protoRepo);
		underTest = new MM.MapRepository(qstub(['error', 'log']), qstub(['hide', 'show']), [repo1, repo2]);
	});
	describe("loadMap", function () {
		it("should check each repository to see if it recognises the mapId", function () {
			spyOn(repo1, 'recognises');
			spyOn(repo2, 'recognises');
			underTest.loadMap('foo');
			expect(repo1.recognises).toHaveBeenCalledWith('foo');
			expect(repo2.recognises).toHaveBeenCalledWith('foo');
		});
		it("should use the repository which recognises the mapId", function () {
			spyOn(repo2, 'recognises').andReturn(true);
			spyOn(repo1, 'loadMap');
			spyOn(repo2, 'loadMap');

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
		it("should dispatch mapLoading Event beforeLoadingStarts", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapLoading', listener);

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