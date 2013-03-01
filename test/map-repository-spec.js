/*jslint nomen: true*/
/*global content, _, jasmine, observable, beforeEach, describe, expect, it, jasmine, jQuery, spyOn, MM*/
describe("Map Repository", function () {
	'use strict';
	var repo1, repo2, underTest,
		dummy = function () {},
		qstub = function (functions) {
			var ret = {};
			_.each(functions, function (func) {
				ret[func] = dummy;
			});
			return ret;
		},
		stubMapInfo = function (mapId) {
			return {mapId: mapId, idea: qstub(['addEventListener'])};
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
				},
				loads: true,
				loadMap: function (mapId) {
					var deferred = jQuery.Deferred();
					if (this.loads) {
						deferred.resolve(stubMapInfo(mapId));
					} else {
						deferred.reject('errorMsg');
					}
					return deferred.promise();
				}
			}
		),
			repoActions = ['saveMap', 'recognises'];
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
			spyOn(repo1, 'loadMap').andCallThrough();
			spyOn(repo2, 'loadMap').andCallThrough();

			underTest.loadMap('foo');

			expect(repo1.loadMap).not.toHaveBeenCalledWith('foo');
			expect(repo2.loadMap).toHaveBeenCalledWith('foo');
		});
		it("should use first repository to load as a fallback option", function () {
			spyOn(repo1, 'loadMap').andCallThrough();

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
		it("should dispatch mapLoadingFailed event if loadmap fails", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapLoadingFailed', listener);
			repo1.loads = false;

			underTest.loadMap('foo');

			expect(listener).toHaveBeenCalledWith('foo', 'errorMsg');
		});
		it("should dispatch mapLoaded event if loadMap succeeds", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapLoaded', listener);

			underTest.loadMap('foo');

			expect(listener).toHaveBeenCalledWith(stubMapInfo('foo').idea, 'foo');
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