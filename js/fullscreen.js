var FullScreen = (function() {

	var e = document.documentElement,
		n = function() {},
		is = false,
		enter = n,
		exit = n,
		toggle = function() {
			is() ? exit() : enter();
		};
		onChangeCb = n,
		onChange = function(cb) {
			onChangeCb = cb;
		};

	if (e.requestFullscreen) {

		document.addEventListener("fullscreenchange", function() {
			onChangeCb(is());
		}, false);

		is = function() {
			return document.fullScreen;
		};
		enter = function() {
			e.requestFullscreen();
		};
		exit = function() {
			document.exitFullscreen();
		};

	} else if (e.webkitRequestFullScreen) {

		document.addEventListener("webkitfullscreenchange", function() {
			onChangeCb(is());
		}, false);

		is = function() {
			return document.webkitIsFullScreen;
		};
		enter = function() {
			e.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		};
		exit = function() {
			document.webkitExitFullscreen();
		};

	} else if (e.mozRequestFullScreen) {

		document.addEventListener("mozfullscreenchange", function() {
			onChangeCb(is());
		}, false);

		is = function() {
			return document.mozFullScreen;
		};
		enter = function() {
			e.mozRequestFullScreen();
		};
		exit = function() {
			document.mozCancelFullScreen();
		};

	} else if (e.msRequestFullscreen) {

		document.addEventListener("MSFullscreenChange", function() {
			onChangeCb(is());
		}, false);

		is = function() {
			return document.msFullscreenElement !== null;
		};
		enter = function() {
			e.msRequestFullscreen();
		};
		exit = function() {
			document.msExitFullscreen();
		};

	}

	return {
		supported: is !== false,
		is: is,
		enter: enter,
		exit: exit,
		toggle: toggle,
		onChange: onChange
	};

})();