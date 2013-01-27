/*global console, setInterval, window*/
(function () {
	'use strict';
	var globalNamespace = { '$': true, '_': true, jQuery: true, Kinetic: true, observable: true, content: true, MAPJS: true, MM: true, switchTo5x: true, _gaq: true }, name;
	for (name in window) {
		globalNamespace[name] = true;
	}
	setInterval(function () {
		var name;
		for (name in window) {
			if (!globalNamespace[name]) {
				console.warn('Unexpected global namespace pollution', name);
				globalNamespace[name] = true;
			}
		}
	}, 1000);
}());
