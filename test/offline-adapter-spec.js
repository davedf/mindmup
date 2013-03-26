/*global beforeEach, content, describe, expect, it, MM, spyOn*/
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
	describe('Explicitly saving to offline', function () {
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
