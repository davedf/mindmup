/*global jasmine, observable, beforeEach, describe, expect, it, jasmine, jQuery, spyOn, MM*/
describe("Map Repository", function () {
	'use strict';
	var publicRepo, personalRepo, underTest;
	beforeEach(function () {
		publicRepo = observable({});
		personalRepo = observable({});
		underTest = new MM.MapRepository({}, {}, publicRepo, personalRepo);
	});
	it("should use default repository to save", function () {
		publicRepo.saveMap = jasmine.createSpy('saveMap');

		underTest.publishMap();

		expect(publicRepo.saveMap).toHaveBeenCalled();
	});
	it("should use default repository to load", function () {
		publicRepo.loadMap = jasmine.createSpy('loadMap');

		underTest.loadMap('foo');

		expect(publicRepo.loadMap).toHaveBeenCalledWith('foo');
	});
	
});