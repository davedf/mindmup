/*jslint nomen: true*/
/*global content, _, jasmine, observable, beforeEach, afterEach, describe, expect, it, jasmine, jQuery, spyOn, MM, sinon*/
describe("Map Repository", function () {
	'use strict';
	var repo1, repo2, underTest, clock,
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
		clock = sinon.useFakeTimers();
		MM.MapRepository.mapLocationChange = function () {};
		var loadMapDeferred,
			saveMapDeferred,
			protoRepo = observable({
				loadMap: function (mapId) {
					var deferred = jQuery.Deferred();
					deferred.resolve('{ "title": "hello" }', mapId, 'application/json');
					return deferred.promise();
				},
				saveMap: function (saveMapinfo) {
					var deferred = jQuery.Deferred();
					deferred.resolve(stubMapInfo(saveMapinfo.mapId));
					return deferred.promise();
				}
			}),
			repoActions = ['recognises'];
		repo1 = _.extend(qstub(repoActions), protoRepo);
		repo2 = _.extend(qstub(repoActions), protoRepo);
		underTest = new MM.MapRepository(qstub(['error', 'log']), qstub(['hide', 'show']), [repo1, repo2]);
	});
	afterEach(function () {
		clock.restore();
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

			expect(listener).toHaveBeenCalledWith('foo', 0);

		});
		it("should dispatch mapLoadingFailed event if loadmap fails", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapLoadingFailed', listener);
			repo1.loadMap = function (mapId) {
				var deferred = jQuery.Deferred();
				deferred.reject('errorMsg', 'error label');
				return deferred.promise();
			};

			underTest.loadMap('foo');

			expect(listener).toHaveBeenCalledWith('foo', 'errorMsg', 'error label');
		});
		it("should dispatch mapLoadingUnAuthorized event if loadmap fails with reason no-access-allowed", function () {
			var listener = jasmine.createSpy(),
				authListener = jasmine.createSpy();
			underTest.addEventListener('mapLoadingFailed', listener);
			underTest.addEventListener('mapLoadingUnAuthorized', authListener);
			repo1.loadMap = function (mapId) {
				var deferred = jQuery.Deferred();
				deferred.reject('no-access-allowed');
				return deferred.promise();
			};

			underTest.loadMap('foo');

			expect(listener).not.toHaveBeenCalled();
			expect(authListener).toHaveBeenCalledWith('foo', 'no-access-allowed');
		});
		it("should dispatch mapLoaded event if loadMap succeeds", function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapLoaded', listener);

			underTest.loadMap('foo');

			expect(JSON.stringify(listener.mostRecentCall.args[0])).toBe('{"title":"hello","id":1}');
			expect(listener.mostRecentCall.args[1]).toBe('foo');
		});
		it("should use retry", function () {
			spyOn(MM, "retry").andCallThrough();
			underTest.loadMap('foo');
			expect(MM.retry).toHaveBeenCalled();
		});
		it("should not retry if not network-error ", function () {
			var callCount = 0;
			repo1.loadMap = function (mapId) {
				callCount++;
				return jQuery.Deferred().reject('errorMsg').promise();
			};
			underTest.loadMap('foo');
			expect(callCount).toBe(1);
		});
		it("should call and then retry 5 times if it is a network-error ", function () {
			var callCount = 0;
			repo1.loadMap = function (mapId) {
				callCount++;
				return jQuery.Deferred().reject('network-error').promise();
			};
			underTest.loadMap('foo');
			clock.tick(120001);
			expect(callCount).toBe(6);
		});
	});
	describe("saveMap", function () {
		beforeEach(function () {
			underTest.setMap(content({}), 'loadedMapId');
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
			expect(repo1.recognises).toHaveBeenCalledWith('foo');
			expect(repo1.recognises).toHaveBeenCalledWith('loadedMapId');
			expect(repo2.recognises).toHaveBeenCalledWith('foo');
			expect(repo2.recognises).toHaveBeenCalledWith('loadedMapId');
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
			var listener = jasmine.createSpy(),
				mapInfo = stubMapInfo('newMapId');
			underTest.addEventListener('mapSaved', listener);

			underTest.publishMap();

			expect(listener).toHaveBeenCalledWith('loadedMapId', mapInfo.idea, false);
		});
		it("should dispatch mapSaved and mapSavedAsNew event if saveMap succeeds and mapId has changed", function () {
			var listener = jasmine.createSpy(),
				mapInfo = stubMapInfo('newMapId');
			underTest.addEventListener('mapSaved', listener);
			repo1.saveMap = function (saveMapinfo) {
				return jQuery.Deferred().resolve(mapInfo).promise();
			};

			underTest.publishMap();

			expect(listener).toHaveBeenCalledWith('newMapId', mapInfo.idea, true);
		});
		it("should use retry", function () {
			spyOn(MM, "retry").andCallThrough();
			underTest.publishMap();
			expect(MM.retry).toHaveBeenCalled();
		});
		it("should not retry if not network-error ", function () {
			var callCount = 0;
			repo1.saveMap = function (saveMapinfo) {
				callCount++;
				return jQuery.Deferred().reject('errorMsg').promise();
			};
			underTest.publishMap();
			expect(callCount).toBe(1);
		});
		it("should call and then retry 5 times if it is a network-error ", function () {
			var callCount = 0;
			repo1.saveMap = function (saveMapinfo) {
				callCount++;
				return jQuery.Deferred().reject('network-error').promise();
			};
			underTest.publishMap();
			clock.tick(120001);
			expect(callCount).toBe(6);
		});
	});
	describe("MM.retry", function () {
		var buildTaskToFailTimes = function (failTimes) {
			var retryCount = 0;
			return function () {
				var deferred = jQuery.Deferred();
				if (failTimes) {
					failTimes--;
					retryCount++;
					deferred.reject(retryCount);
				} else {
					deferred.resolve(retryCount);
				}
				return deferred.promise();
			};
		};
		it("should retry until task succeeds then resolve", function () {
			var retryCount = 0;
			MM.retry(buildTaskToFailTimes(4), MM.retryTimes(4)).then(function (r) { retryCount = r; });
			expect(retryCount).toBe(4);
		});
		it("should reject once the task retries exceeded", function () {
			var retryCount = 0;
			MM.retry(buildTaskToFailTimes(5), MM.retryTimes(4)).fail(function (r) {retryCount = r; });
			expect(retryCount).toBe(5);
		});
		it("should setTimeout if backoff supplied", function () {
			var retryCount = 0;
			MM.retry(buildTaskToFailTimes(1), MM.retryTimes(1), function () { return 1000; })
				.then(function (r) { retryCount = r; });
			clock.tick(999);
			expect(retryCount).toBe(0);
			clock.tick(2);
			expect(retryCount).toBe(1);
		});
	});
	describe("MM.linearBackoff", function () {
		it("should return increasing number of seconds with each call", function () {
			var underTest = MM.linearBackoff();
			expect(underTest()).toBe(1000);
			expect(underTest()).toBe(2000);
		});
	});
});