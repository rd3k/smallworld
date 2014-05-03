var randomness = (function() {

	'use strict';

	var rng,
		seed;

	function randomSeed() {
		var s = Math.random().toString(36);
		return s.substr(2, 4 + Math.floor(Math.random() * (s.length - 4)));
	}

	function init(s) {
		rng = new RNG(seed = (s ? s : randomSeed()));
	}

	function reset() {
		rng = new RNG(seed);
	}

	function rand() {
		return rng.uniform();
	}

	init();

	return {
		init: init,
		reset: reset,
		get seed() { return seed; },
		rand: rand
	};

}());