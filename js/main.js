var App;
(function (App) {



})(App || (App = {}));



App.init = function() {

	// From Modernizr 2.8.1
	// IE9+, Android 3.0+
	var supportsSVG = !!document.createElementNS && !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;

	// From Modernizr 2.8.1
	// IE10+, iOS Safari 5.0+, Android 4.2+
	var supportsRange = (function() {

		var bool,
			defaultView,
			docElement = document.documentElement,
			inputElem = document.createElement("input");

		inputElem.setAttribute("type", "range");
		bool = inputElem.type !== "text";

		if (bool) {
			inputElem.value = "v";
			inputElem.style.cssText = "position:absolute;visibility:hidden;";
			if (inputElem.style.WebkitAppearance !== undefined) {
				docElement.appendChild(inputElem);
				defaultView = document.defaultView;
				bool = defaultView.getComputedStyle &&
					defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== "textfield" &&
					(inputElem.offsetHeight !== 0);
				docElement.removeChild(inputElem);
			} else {
				bool = inputElem.value !== "v";
			}
		}

		return !!bool;

	}());

}

var SmallWorld = (function() {

	'use strict';



	google.load("visualization", "1", {packages:["corechart"], callback: init});

	var UI = {
		pChanger: document.getElementById("pChanger"),
		pVal: document.getElementById("pVal"),
		pType: document.getElementById("pType"),
		nChanger: document.getElementById("nChanger"),
		nVal: document.getElementById("nVal"),
		kChanger: document.getElementById("kChanger"),
		kVal: document.getElementById("kVal"),
		sChanger: document.getElementById("sChanger"),
		sVal: document.getElementById("sVal"),
		steps: document.getElementById("steps"),
		edgesVal: document.getElementById("edgesVal"),
		componentsVal: document.getElementById("componentsVal"),
		rewireVal: document.getElementById("rewireVal"),
		degreeChart: document.getElementById("degreeChart"),
		dijkstraLVal: document.getElementById("dijkstraLVal"),
		bfsLVal: document.getElementById("bfsLVal"),
		fwVal: document.getElementById("fwVal"),
		clusterVal: document.getElementById("clusterVal"),
		wsAlgo: document.getElementById("wsAlgo"),
		nwAlgo: document.getElementById("nwAlgo"),
		seedVal: document.getElementById("seedVal"),
		info: document.getElementById("info"),
		fullScreen: document.getElementById("fullScreen")
	};

	var chartOptions = {
		legend: {"position": "none"},
		width: 380,
		height: 300,
		fontSize: 9,
		backgroundColor: { fill: "transparent" },
		colors: ["#444"],
		vAxis: {ticks: [], title: "Number of nodes"},
		hAxis: {title: "Degree", showTextEvery: 1, maxAlternation: 1, minTextSpacing: 0, baselineColor: "transparent", gridlines: {color: "transparent"}, minorGridlines: {count: 0}, slantedText: false},
		chartArea: {left:30, top:30, width: 340, height: 220}
	};

	function drawChart() {

		var chartData = [["Degree", "Quantity"]],
			degrees = SmallWorld.getDegrees(),
			chart = new google.visualization.ColumnChart(UI.degreeChart),
			maxq = 0,
			maxd = 0,
			data,
			i,
			d;

		for (d in degrees) {
			chartData.push([d, degrees[d]]);
			if (degrees[d] > maxq) {
				maxq = degrees[d];
			}
			if (d > maxd) {
				maxd = d;
			}
		}

		data = google.visualization.arrayToDataTable(chartData);

		chartOptions.vAxis.ticks = [];
		for (i = 0; i <= maxq; i++) {
			chartOptions.vAxis.ticks.push(i);
		}

		chart.draw(data, chartOptions);

	}

	var n = 10, k = 2 , p = 0, s = 1, algo = SmallWorldAlgo.WattsStrogatz;

	function readHash() {

		var hash = window.location.hash.replace("#", "");

		if (hash !== "") {

			hash = hash.split("_");
			if (hash.length >= 5) {
				randomness.init(hash[0]);
				algo = parseInt(hash[1]);
				n = parseInt(hash[2]);
				k = parseInt(hash[3]);
				p = parseFloat(hash[4]);
				if (hash.length === 6) {
					s = parseInt(hash[5]);
				}
			}

			if (algo === SmallWorldAlgo.NewmannWatts) {
				if (UI.nwAlgo.checked !== true) {
					UI.nwAlgo.checked = true;
					nwCheck();
				}
			} else if (UI.wsAlgo.checked !== true) {
				UI.wsAlgo.checked = true;
				wsCheck();
			}

			if (isNaN(n)) {
				n = 10;
			} else if (n < +UI.nChanger.min) {
				n = +UI.nChanger.min;
			} else if (n > +UI.nChanger.max) {
				n = +UI.nChanger.max;
			}

			if (isNaN(k)) {
				k = 2;
			} else if (k < +UI.kChanger.min) {
				k = +UI.kChanger.min;
			} else if (k > +UI.kChanger.max) {
				k = +UI.kChanger.max;
			}

			if (isNaN(p)) {
				p = 0;
			} else if (p < +UI.pChanger.min) {
				p = +UI.pChanger.min;
			} else if (p > +UI.pChanger.max) {
				p = +UI.pChanger.max;
			}

			if (isNaN(s)) {
				s = 1;
			} else if (s < +UI.sChanger.min) {
				s = +UI.sChanger.min;
			} else if (s > +UI.sChanger.max) {
				s = +UI.sChanger.max;
			}

		}

	}

	function updateL() {

		var result = SmallWorld.averageGeodesicDistance(ShortestPathAlgo.Dijkstra);
		UI.dijkstraLVal.innerHTML = "Dijkstra: " + result[0].toFixed(2) + " (" + result[1].toFixed(3) + " ms)";

		result = SmallWorld.averageGeodesicDistance(ShortestPathAlgo.BFS);
		UI.bfsLVal.innerHTML = "BFS: " + result[0].toFixed(2) + " (" + result[1].toFixed(3) + " ms)";

		result = SmallWorld.averageGeodesicDistance(ShortestPathAlgo.FloydWarshall);
		UI.fwVal.innerHTML = "Floyd Warshall: " + result[0].toFixed(2) + " (" + result[1].toFixed(3) + " ms)";

	}

	function updateHash() {

		var newHash = randomness.seed + "_" + algo + "_" + UI.nVal.innerHTML + "_" + UI.kVal.innerHTML + "_" + UI.pVal.innerHTML;

		if (algo === SmallWorldAlgo.NewmannWatts) {
			newHash += "_" + UI.sVal.innerHTML;
		}

		if (window.location.hash.replace("#", "") !== newHash) {
			window.location.hash = newHash;
			return true;
		}

		return false;

	}

	function init() {

		readHash();

		UI.nVal.innerHTML = n;
		UI.nChanger.value = n;

		UI.kVal.innerHTML = k;
		UI.kChanger.value = k;

		UI.pVal.innerHTML = p;
		UI.pChanger.value = p;

		UI.sVal.innerHTML = s;
		UI.sChanger.value = s;

		UI.seedVal.innerHTML = randomness.seed;

		SmallWorld.init(algo, n, k, p, s);

		if (!updateHash()) {

			UI.edgesVal.innerHTML = "Edges: " + SmallWorld.edgeCount();
			UI.componentsVal.innerHTML = "Components: " + SmallWorld.componentCount();
			UI.rewireVal.innerHTML = "Rewires: " + SmallWorld.rewireCount();

			updateL();

			UI.clusterVal.innerHTML = "Clustering: " + SmallWorld.clusteringCoefficient().toFixed(3);

			drawChart();

		}

	}

	function changeN(e) {
		var n = e.target.valueAsNumber;
		UI.nVal.innerHTML = n;
		UI.nVal.className = "val";
		updateHash();
	}
	UI.nChanger.addEventListener("change", changeN);
	UI.nChanger.addEventListener("touchend", changeN);
	UI.nChanger.addEventListener("input", function(e) {
		UI.nVal.innerHTML = e.target.valueAsNumber;
		UI.nVal.className = "val changing";
	});

	function changeK(e) {
		var k = e.target.valueAsNumber;
		UI.kVal.innerHTML = k;
		UI.kVal.className = "val";
		updateHash();
	}
	UI.kChanger.addEventListener("change", changeK);
	UI.kChanger.addEventListener("touchend", changeK);
	UI.kChanger.addEventListener("input", function(e) {
		UI.kVal.innerHTML = e.target.valueAsNumber;
		UI.kVal.className = "val changing";
	});

	function changeP(e) {
		var p = e.target.valueAsNumber;
		UI.pVal.innerHTML = p;
		UI.pVal.className = "val";
		updateHash();
	}
	UI.pChanger.addEventListener("change", changeP);
	UI.pChanger.addEventListener("touchend", changeP);
	UI.pChanger.addEventListener("input", function(e) {
		UI.pVal.innerHTML = e.target.valueAsNumber;
		UI.pVal.className = "val changing";
	});

	function changeS(e) {
		var s = e.target.valueAsNumber;
		UI.sVal.innerHTML = s;
		UI.sVal.className = "val";
		updateHash();
	}
	UI.sChanger.addEventListener("change", changeS);
	UI.sChanger.addEventListener("touchend", changeS);
	UI.sChanger.addEventListener("input", function(e) {
		UI.sVal.innerHTML = e.target.valueAsNumber;
		UI.sVal.className = "val changing";
	});

	UI.wsAlgo.addEventListener("change", wsCheck);

	function wsCheck() {
		UI.pType.innerHTML = "rewiring";
		UI.steps.className = "";
		UI.rewireVal.className = "visible";
		algo = SmallWorldAlgo.WattsStrogatz;
		updateHash();
	}

	UI.nwAlgo.addEventListener("change", nwCheck);

	function nwCheck() {
		UI.pType.innerHTML = "addition";
		UI.steps.className = "visible";
		UI.rewireVal.className = "";
		algo = SmallWorldAlgo.NewmannWatts;
		updateHash();
	}


	document.body.addEventListener("keyup", function(e) {
		if (e.which === 32) {
			randomness.init();
			hideInfo();
			updateHash();
			if (p > 0) {
				init();
			}
		}
	});

	document.body.addEventListener("click", function() {
		hideInfo();
		SmallWorld.clearHighlight();
	});

	window.addEventListener("hashchange", function() {
		randomness.reset();
		hideInfo();
		init();
	}, false);

	// Full screen
	UI.fullScreen.className = FullScreen.supported ? "enter" : "hidden";
	UI.fullScreen.addEventListener("click", FullScreen.toggle);
	FullScreen.onChange(function(isFullScreen){
		UI.fullScreen.className = isFullScreen ? "exit" : "enter";
	});


	var InfoBubble = (function(){
		
		var domel;

		function info(el) {
			domel = el;
		}

		info.prototype = {
			hide: function() {
				el.className = el.innerHTML = "";
			},
			showNodeInfo: function(node, degree) {
				el.className = "node";
				el.innerHTML = "Node " + node + " has degree " + degree;
			},
			showPathInfo: function(from, to, length) {
				el.className = "path";
				if (length === 0) {
					el.innerHTML = "Node " + to + " is not reachable from node " + from;
				} else {
					el.innerHTML = "Shortest path from node " + from + " to node " + to + " is of length " + length;
				}
			}
		}

		return info;

	}());

	var iB = new InfoBubble(UI.info);

	return SmallWorld;

}());