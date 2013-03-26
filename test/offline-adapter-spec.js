/*global beforeEach, content, describe, expect, it, MM, spyOn, localStorage*/
describe('OfflineAdapter', function () {
	'use strict';
	var jsonStorage, underTest;
	beforeEach(function () {
		jsonStorage = MM.jsonStorage(localStorage);
		underTest = new MM.OfflineAdapter(jsonStorage);
	});
	it('recognises mapIds starting with "o"', function () {
		expect(underTest.recognises('oPress+Enter+To+Edit')).toBe(true);
		expect(underTest.recognises('g1234566797977797977')).toBe(false);
		expect(underTest.recognises('alaksjdflajsldkfjlas')).toBe(false);
	});
	describe('loadMap', function () {
		beforeEach(function () {
			localStorage.clear();
			localStorage.setItem('offline-map-99', '{"idea":{"title":"Hello World","id":1}}');
		});
		it('should return map as promised', function () {
			underTest.loadMap('offline-map-99').then(
				function (idea, mapId, mimeType) {
					expect(idea).toEqual({title: "Hello World", id: 1});
					expect(mapId).toBe('offline-map-99');
					expect(mimeType).toBe('application/json');
				},
				this.fail.bind(this, 'loadMap should succeed')
			);
		});
		it('should fail with not-found error if map not found', function () {
			underTest.loadMap('offline-map-999').then(
				this.fail.bind(this, 'loadMap should not succeed'),
				function (reason) {
					expect(reason).toBe('not-found');
				}
			);
		});
	});
	describe('saveMap', function () {
		beforeEach(function () {
			localStorage.clear();
		});
		it('should save an existing map from another storage provider into local storage when saveMap method is invoked', function () {
			underTest.saveMap({
				mapId: 'g123',
				idea: content({title: 'Hello World', id: 1})
			});

			expect(localStorage.getItem('offline-map-1')).toBe('{"idea":{"title":"Hello World","id":1}}');
			expect(JSON.parse(localStorage.getItem('offline-maps')).nextMapId).toBe(2);
		});
		it('should save an existing offline map into local storage when saveMap method is invoked', function () {
			underTest.saveMap({
				mapId: 'offline-map-123',
				idea: content({title: 'Hello World', id: 1})
			});

			expect(localStorage.getItem('offline-map-123')).toBe('{"idea":{"title":"Hello World","id":1}}');
		});
		it('should save an existing map from another storage provider into local storage when saveMap method is invoked', function () {
			underTest.saveMap({
				mapId: 'new',
				idea: content({title: 'Hello World', id: 1})
			});

			expect(localStorage.getItem('offline-map-1')).toBe('{"idea":{"title":"Hello World","id":1}}');
		});
		it('should fail with failed-offline when local storage throws an error (like quota exceeded)', function () {
			spyOn(jsonStorage, 'setItem').andThrow('Quota exceeded');
			underTest.saveMap({
				mapId: 'new',
				idea: content({title: 'a very large map', id: 1})
			}).then(
				this.fail.bind(this, 'saveMap should not succeed'),
				function (reason) {
					expect(reason).toBe('failed-offline');
				}
			);
		});
	});
});
