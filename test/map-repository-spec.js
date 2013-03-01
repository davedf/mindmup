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
		MM.MapRepository.mapLocationChange = function () {};
		var protoRepo = observable(
			{
				loadMap: function (mapId) {
					var deferred = jQuery.Deferred();
					deferred.resolve(stubMapInfo(mapId));
					return deferred.promise();
				},
				saveMap: function (saveMapinfo) {
					var deferred = jQuery.Deferred();
					deferred.resolve(stubMapInfo(saveMapinfo.mapId));
					return deferred.promise();
				}
			}
		),
			repoActions = ['recognises'];
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
		it("should dispatch mapLoading Event beforeLoadingStarts", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapLoading', listener);

			underTest.loadMap('foo');

			expect(listener).toHaveBeenCalledWith('foo');

		});
		it("should dispatch mapLoadingFailed event if loadmap fails", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapLoadingFailed', listener);
			repo1.loadMap = function (mapId) {
				var deferred = jQuery.Deferred();
				deferred.reject('errorMsg');
				return deferred.promise();
			};

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
		beforeEach(function () {
			underTest.setMap(stubMapInfo('loadedMapId'));
		});
		it("should use first repository to load as a fallback option", function () {
			spyOn(repo1, 'saveMap').andCallThrough();
			underTest.publishMap();

			expect(repo1.saveMap).toHaveBeenCalled();
		});
		it("should check each repository to see if it recognises the mapId", function () {
			spyOn(repo1, 'recognises');
			spyOn(repo2, 'recognises');
			underTest.publishMap('foo');
			expect(repo1.recognises).toHaveBeenCalled();//With(['foo', 'loadedMapId']);
			expect(repo2.recognises).toHaveBeenCalled(); //With(['foo', 'loadedMapId']);
		});
		it("should use the repository which recognises the mapId", function () {
			repo2.recognises = function (id) {return (id === 'loadedMapId'); };
			spyOn(repo1, 'saveMap').andCallThrough();
			spyOn(repo2, 'saveMap').andCallThrough();

			underTest.publishMap('foo');

			expect(repo1.saveMap).not.toHaveBeenCalled();
			expect(repo2.saveMap).toHaveBeenCalled();
		});
		it("should use the repository which recognises the repositoryType", function () {
			repo2.recognises = function (id) {return (id === 'foo'); };
			spyOn(repo1, 'saveMap').andCallThrough();
			spyOn(repo2, 'saveMap').andCallThrough();

			underTest.publishMap('foo');

			expect(repo1.saveMap).not.toHaveBeenCalled();
			expect(repo2.saveMap).toHaveBeenCalled();
		});
		it("should dispatch mapSaving Event before Saving starts", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapSaving', listener);

			underTest.publishMap();

			expect(listener).toHaveBeenCalled();

		});
		it("should dispatch mapLoadingFailed event if saveMap fails", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapSavingFailed', listener);
			repo1.saveMap = function (saveMapinfo) {
				var deferred = jQuery.Deferred();
				deferred.reject();
				return deferred.promise();
			};

			underTest.publishMap();

			expect(listener).toHaveBeenCalled();
		});
		it("should dispatch mapSaved event if saveMap succeeds and mapId not changed", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapSaved', listener);

			underTest.publishMap();

			expect(listener).toHaveBeenCalled();
		});
		it("should dispatch mapSaved and mapSavedAsNew event if saveMap succeeds and mapId has changed", function () {
			var listener = jasmine.createSpy(),
				listenerNew = jasmine.createSpy();
			underTest.addEventListener('mapSaved', listener);
			underTest.addEventListener('mapSavedAsNew', listenerNew);
			repo1.saveMap = function (saveMapinfo) {
				var deferred = jQuery.Deferred();
				deferred.resolve(stubMapInfo('newMapId'));
				return deferred.promise();
			};

			underTest.publishMap();

			expect(listener).toHaveBeenCalled();
			expect(listenerNew).toHaveBeenCalled();
		});

	});
});