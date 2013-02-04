if (!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
		'use strict';
		if (typeof this !== 'function') {
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}
		var args = Array.prototype.slice.call(arguments, 1),
			fToBind = this;
		return function () {
			return fToBind.apply(oThis, args.concat(Array.prototype.slice.call(arguments)));
		};
	};
}
