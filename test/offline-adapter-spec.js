/*global jasmine, beforeEach, afterEach, sinon, describe, expect, it, MAPJS, MM, spyOn, localStorage*/
describe('OfflineAdapter', function () {
	'use strict';
	var jsonStorage, underTest;
	beforeEach(function () {
		localStorage.clear();
		jsonStorage = MM.jsonStorage(localStorage);
		underTest = new MM.OfflineAdapter(new MM.OfflineMapStorage(jsonStorage, 'offline'));
	});
	it('recognises mapIds starting with "o"', function () {
		expect(underTest.recognises('oPress+Enter+To+Edit')).toBe(true);
		expect(underTest.recognises('g1234566797977797977')).toBe(false);
		expect(underTest.recognises('alaksjdflajsldkfjlas')).toBe(false);
	});
	describe('loadMap', function () {
		beforeEach(function () {
			localStorage.setItem('offline-map-99', '{"map":{"title":"Hello World","id":1}}');
		});
		it('should return map as promised', function () {
			underTest.loadMap('offline-map-99').then(
				function (map, mapId, mimeType) {
					expect(map).toEqual({title: 'Hello World', id: 1});
					expect(mapId).toBe('offline-map-99');
					expect(mimeType).toBe('application/json');
				},
				this.fail.bind(this, 'loadMap should succeed')
			);
		});
		it('should fail with not-found error if map not found', function () {
			var errorReason;
			underTest.loadMap('offline-map-999').then(
				this.fail.bind(this, 'loadMap should not succeed'),
				function (reason) {
					errorReason = reason;
				}
			);
			expect(errorReason).toBe('not-found');
		});
	});
	describe('saveMap', function () {
		it('should save an existing map from another storage provider into local storage when saveMap method is invoked', function () {
			underTest.saveMap({
				mapId: 'g123',
				idea: MAPJS.content({title: 'Hello World', id: 1})
			});
			expect(localStorage.getItem('offline-map-1')).toBe('{"map":{"title":"Hello World","id":1,"formatVersion":2}}');
			expect(JSON.parse(localStorage.getItem('offline-maps')).nextMapId).toBe(2);
		});
		it('should save an existing offline map into local storage when saveMap method is invoked', function () {
			underTest.saveMap({
				mapId: 'offline-map-123',
				idea: MAPJS.content({title: 'Hello World', id: 1})
			});

			expect(localStorage.getItem('offline-map-123')).toBe('{"map":{"title":"Hello World","id":1,"formatVersion":2}}');
		});
		it('should save an existing map from another storage provider into local storage when saveMap method is invoked', function () {
			underTest.saveMap({
				mapId: 'new',
				idea: MAPJS.content({title: 'Hello World', id: 1})
			});

			expect(localStorage.getItem('offline-map-1')).toBe('{"map":{"title":"Hello World","id":1,"formatVersion":2}}');
		});
		it('should fail with failed-offline when local storage throws an error (like quota exceeded)', function () {
			spyOn(jsonStorage, 'setItem').andThrow('Quota exceeded');
			underTest.saveMap({
				mapId: 'new',
				idea: MAPJS.content({title: 'a very large map', id: 1})
			}).then(
				this.fail.bind(this, 'saveMap should not succeed'),
				function (reason) {
					expect(reason).toBe('local-storage-failed');
				}
			);
		});
	});
});
describe('Offline Fallback', function () {
	'use strict';
	var jsonStorage, underTest, map;
	beforeEach(function () {
		localStorage.clear();
		jsonStorage = MM.jsonStorage(localStorage);
		underTest = new MM.OfflineFallback(jsonStorage);
		map = MAPJS.content({ title: 'Hello World!' });
	});
	describe('Storing a map locally', function () {
		it('should store map locally under fallback-mapId key', function () {
			underTest.saveMap('g123', map);

			expect(localStorage.getItem('fallback-g123')).toBe('{"map":{"title":"Hello World!","formatVersion":2,"id":1}}');
		});
	});
	describe('Loading a map from fallback offline storage', function () {
		it('should return null is there is no matching map', function () {
			var result = underTest.loadMap('g123');

			expect(result).toBeNull();
		});
		it('should return a map if there is a matching one', function () {
			var result;
			localStorage.setItem('fallback-g123', '{"map":{"title":"Hello World!","id":1,"formatVersion":2}}');

			result = underTest.loadMap('g123');

			expect(result).toEqual({ title: 'Hello World!', id: 1, formatVersion: 2 });
		});
	});
	describe('Removing a map from fallback offline storage', function () {
		it('', function () {
			localStorage.setItem('fallback-g123', '{"map":{"title":"Hello World!","formatVersion":2,"id":1}}');

			underTest.remove('g123');

			expect(localStorage.getItem('fallback-g123')).toBeNull();
		});
	});
});
describe('OfflineMapStorage', function () {
	'use strict';
	var jsonStorage, underTest, clock, map;
	beforeEach(function () {
		clock = sinon.useFakeTimers();
		localStorage.clear();
		jsonStorage = MM.jsonStorage(localStorage);
		map = MAPJS.content({ title: 'Hello World!' });
		underTest = new MM.OfflineMapStorage(jsonStorage, 'offline');
	});
	afterEach(function () {
		clock.restore();
	});
	describe('saveNew file information', function () {
		it('should return mapId', function () {
			var result = underTest.saveNew(map);
			expect(result).toBe('offline-map-1');
		});
		it('should store file information and increment nextMapId', function () {
			clock.tick(2000);
			underTest.saveNew(map);
			expect(localStorage.getItem('offline-maps')).toBe('{"nextMapId":2,"maps":{"offline-map-1":{"d":"Hello World!","t":2}}}');
		});
		it('should store file content', function () {
			underTest.saveNew(map);
			expect(localStorage.getItem('offline-map-1')).toBe('{"map":{"title":"Hello World!","formatVersion":2,"id":1}}');
		});
	});
	describe('overwriting file information', function () {
		var mapId;
		beforeEach(function () {
			mapId = underTest.saveNew(map);
			map.title = 'a new description';
		});
		it('should overwrite file content', function () {
			underTest.save(mapId, map);
			expect(localStorage.getItem('offline-map-1')).toBe('{"map":{"title":"a new description","formatVersion":2,"id":1}}');
		});
		it('should update title and timestamp', function () {
			clock.tick(2000);
			underTest.save(mapId, map);
			expect(localStorage.getItem('offline-maps')).toBe('{"nextMapId":2,"maps":{"offline-map-1":{"d":"a new description","t":2}}}');
		});
	});
	describe('restoring file information', function () {
		var mapId, fileInfo;
		beforeEach(function () {
			fileInfo = {d: 'a restored description', t: 1};
			mapId = underTest.saveNew(map);
			map.title = fileInfo.d;
		});
		it('should restore map', function () {
			underTest.restore(mapId, map, fileInfo);
			expect(localStorage.getItem('offline-map-1')).toBe('{"map":{"title":"a restored description","formatVersion":2,"id":1}}');
		});
		it('should restore title and timestamp', function () {
			clock.tick(22000);
			underTest.restore(mapId, map, fileInfo);
			expect(localStorage.getItem('offline-maps')).toBe('{"nextMapId":2,"maps":{"offline-map-1":{"d":"a restored description","t":1}}}');
		});
		it('should dispatch mapRestored event', function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapRestored', listener);
			underTest.restore(mapId, map, fileInfo);
			expect(listener).toHaveBeenCalledWith(mapId, map, fileInfo);
		});
	});
	describe('deleting file information', function () {
		var mapId;
		beforeEach(function () {
			mapId = underTest.saveNew(map);
		});
		it('should remove file content', function () {
			underTest.remove(mapId);
			expect(localStorage.getItem('offline-map-1')).toBeNull();
		});
		it('should remove file information', function () {
			underTest.remove(mapId);
			expect(localStorage.getItem('offline-maps')).toBe('{"nextMapId":2,"maps":{}}');
		});
		it('should dispatch mapDeleted event', function () {
			var listener = jasmine.createSpy();
			underTest.addEventListener('mapDeleted', listener);
			underTest.remove(mapId);
			expect(listener).toHaveBeenCalledWith(mapId);
		});
	});
	describe('retrieving files and file information', function () {
		var mapId1, mapId2;
		beforeEach(function () {
			mapId1 = underTest.saveNew(map);
			map.title = 'new description';
			mapId2 = underTest.saveNew(map);
		});
		it('should return a list of files', function () {
			var result = underTest.list();
			expect(result).toEqual({
				'offline-map-1': {
					d: 'Hello World!',
					t: 0
				},
				'offline-map-2': {
					d: 'new description',
					t: 0
				}
			});
		});
		it('should return file content', function () {
			var result = underTest.load(mapId1);
			expect(result).toEqual({ title: 'Hello World!', id: 1, formatVersion: 2 });
		});
	});
});
