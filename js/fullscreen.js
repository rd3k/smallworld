var fullScreen = function(e) {
	function n() {}
	return e.requestFullscreen ? {
		supported: !0,
		is: function() {
			return document.fullScreen
		},
		enter: function() {
			e.requestFullscreen()
		},
		exit: function() {
			document.exitFullscreen()
		}
	} : e.webkitRequestFullScreen ? {
		supported: !0,
		is: function() {
			return document.webkitIsFullScreen
        },
        enter: function() {
            e.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
        },
        exit: function() {
            document.webkitExitFullscreen()
        }
	} : e.mozRequestFullScreen ? {
		supported: !0,
		is: function() {
			return document.mozFullScreen
		},
		enter: function() {
			e.mozRequestFullScreen()
		},
		exit: function() {
			document.mozCancelFullScreen()
		}
	} : e.msRequestFullscreen ? {
		supported: !0,
		is: function() {
			return document.msFullscreenElement != null;
		},
		enter: function() {
			e.msRequestFullscreen();
		},
		exit: function() {
			document.msExitFullscreen();
		}
	} : {
		supported: !1,
		is: !1,
		enter: n,
		exit: n
	}
}(document.documentElement);