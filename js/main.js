var SmallWorld = (function() {

	'use strict';

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

	google.load("visualization", "1", {packages:["corechart"], callback: init});

	var ShortestPathAlgo = {};
	ShortestPathAlgo[ShortestPathAlgo.Dijkstra = 0] = "Dijkstra";
	ShortestPathAlgo[ShortestPathAlgo.BFS = 1] = "BFS";
	ShortestPathAlgo[ShortestPathAlgo.FloydWarshall = 2] = "FloydWarshall";

	var SmallWorldAlgo = {};
	SmallWorldAlgo[SmallWorldAlgo.WattsStrogatz = 0] = "WattsStrogatz";
	SmallWorldAlgo[SmallWorldAlgo.NewmannWatts = 1] = "NewmannWatts";

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
		effVal: document.getElementById("effVal"),
		clusterVal: document.getElementById("clusterVal"),
		wsAlgo: document.getElementById("wsAlgo"),
		nwAlgo: document.getElementById("nwAlgo"),
		seedVal: document.getElementById("seedVal"),
		info: document.getElementById("info"),
		fullScreen: document.getElementById("fullScreen")
	};

	UI.fullScreen.className = fullScreen.supported ? "enter" : "hidden";

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

	var SmallWorld = (function () {

		var graph = Viva.Graph.graph(),
			layout = Viva.Graph.Layout.constant(graph),
			graphics = Viva.Graph.View.svgGraphics(),
			renderer = Viva.Graph.View.renderer(graph, {
				layout: layout,
				graphics : graphics,
				interactive: false
			}),
			nodeRadius = 7,
			algo,
			n,
			k,
			p,
			s,
			rewires = 0,
			nodeIDs = [],
			highlightedLinkUI = [],
			highlightedNodeUI = [],
			pathFrom = null,
			pathTo = null;

		// Draw as ring network
		layout.placeNode(function(node) {

			var angle = ((node.id / n) * 360) * (Math.PI / 180),
				radius = Math.min(8 * n, 240);
			return {x: radius * Math.cos(angle), y: radius * Math.sin(angle)};

		});

		// Circular nodes
		graphics.node(function(node) {

			var ui = Viva.Graph.svg("circle").attr("r", nodeRadius).attr("fill", "#000").attr("d", node.id);

			ui.addEventListener("click", function(e) {

				e.stopPropagation();

				if (e.shiftKey && pathFrom !== null) {

					showShortPath(pathFrom, node.id);

				} else {

					pathFrom = node.id;
					showNodeLinks(node);

				}

			});

			return ui;

		}).placeNode(function(nodeUI, pos){

			nodeUI.attr("cx", pos.x).attr("cy", pos.y);

		});

		function init(algoVal, nVal, kVal, pVal, sVal) {

			algo = algoVal;
			n = nVal;
			k = kVal;
			p = pVal;
			s = sVal;
			highlightedLinkUI = [];
			highlightedNodeUI = [];
			pathFrom = null;
			pathTo = null;
			renderer.run();
			create();

		}

		function showNodeLinks(node) {
				
			var links = graph.getLinks(node.id),
				linkUI,
				fromUI,
				toUI,
				i;

			clearHighlight();

			for (i = 0; i < links.length; i++) {

				linkUI = graphics.getLinkUI(links[i].id);

				if (linkUI) {

					highlightedLinkUI.push(linkUI);
					linkUI.attr("stroke", "red").attr("stroke-width", 2);

					toUI = graphics.getNodeUI(links[i].toId);
					toUI.attr("fill", "red");
					highlightedNodeUI.push(toUI);

					fromUI = graphics.getNodeUI(links[i].fromId);
					fromUI.attr("fill", "red");
					highlightedNodeUI.push(fromUI);

				}

			}

			fromUI = graphics.getNodeUI(node.id);
			fromUI.attr("fill", "#990000");
			highlightedNodeUI.push(fromUI);

			showNodeInfo(node.id, graph.getLinks(node.id).length);

		}

		function showShortPath(from, to) {

			var path,
				link,
				nodeUI,
				linkUI,
				i;

			clearHighlight();

			path = dijktraShortestPath(from, to)[1];

			nodeUI = graphics.getNodeUI(to);
			nodeUI.attr("fill", "red");
			highlightedNodeUI.push(nodeUI);

			if (path.length === 1) {

				nodeUI = graphics.getNodeUI(from);
				nodeUI.attr("fill", "#990000");
				highlightedNodeUI.push(nodeUI);

			} else {

				for (i = 0; i < path.length - 1; i++) {
					link = graph.hasLink(path[i], path[i + 1]);
					if (!link) {
						link = graph.hasLink(path[i + 1], path[i]);
					}
					linkUI = graphics.getLinkUI(link.id);
					highlightedLinkUI.push(linkUI);
					linkUI.attr("stroke-width", 2).attr("class", "path-step-" + (path.length - i - 1));
				}

				nodeUI = graphics.getNodeUI(from);
				nodeUI.attr("fill", "#990000");
				highlightedNodeUI.push(nodeUI);

			}

			showPathInfo(from, to, path.length - 1);

		}

		function clearHighlight() {

			for (var i = 0; i < highlightedNodeUI.length; i++) {
				highlightedNodeUI[i].attr("fill", "#000");
			}

			highlightedNodeUI.length = 0;

			for (i = 0; i < highlightedLinkUI.length; i++) {
				highlightedLinkUI[i].attr("stroke", "#999").attr("stroke-width", 1).attr("class", "");
			}

			highlightedLinkUI.length = 0;

		}

		function getDegrees() {

			var degrees = {},
				degree,
				max = 0,
				i;

			graph.forEachNode(function(node) {

				degree = graph.getLinks(node.id).length;
				if (degrees.hasOwnProperty(degree)) {
					degrees[degree]++;
				} else {
					degrees[degree] = 1;
				}
				if (degree > max) {
					max = degree;
				}

			});

			for (i = 0; i < max; i++) {
				if (!degrees.hasOwnProperty(i)) {
					degrees[i] = 0;
				}
			}

			return degrees;

		}

		// Similar to breadthFirstSearchDepth... 
		function reachable(sourceNodeId) {

			var visitQueue = [],
				visited = [];

			function visitLinkedNode(node) {

				if (visited.indexOf(node.id) === -1) {
					visited.push(node.id);
					visitQueue.push(node.id);
				}

			}

			visitQueue.push(sourceNodeId);
			visited.push(sourceNodeId);

			while (visitQueue.length > 0) {
				graph.forEachLinkedNode(visitQueue.shift(), visitLinkedNode);
			}

			return visited;

		}

		function breadthFirstSearchDepth(sourceNodeId, targetNodeId) {

			var visitQueue = [],
				visited = [],
				depths = [],
				perf = window.performance,
				start = perf.now(),
				t;

			function visitLinkedNode(node) {

				if (visited.indexOf(node.id) === -1) {
					visited.push(node.id);
					depths.push(depths[visited.indexOf(t)] + 1);
					visitQueue.push(node.id);
				}

			}

			visitQueue.push(sourceNodeId);
			visited.push(sourceNodeId);
			depths.push(0);

			while (visitQueue.length > 0) {

				t = visitQueue.shift();

				if (t === targetNodeId) {
					return [depths[visited.indexOf(t)], perf.now() - start];
				}

				graph.forEachLinkedNode(t, visitLinkedNode);

			}

			return [Number.MAX_VALUE, 0];

		}

		/*
		*  Returns the length of the shortest path between the source node and the destination node
		*  calculated using the Floyd–Warshall algorithm
		*
		*  @param Boolean allPaths - true if the method should return all a matrix will all the paths, false to return only the lenght of the required path
		*  @param int sourceNodeId - starting node
		*  @param int targetNodeId - destination node
		*  @return [dist, runtime]
		*/

		function floydWarshall(sourceNodeId, targetNodeId, allPaths) {

			var dist = [],
				perf = window.performance,
				start = perf.now(),
				end,
				i,
				j,
				k;

			function initPathSize(linkedNode) {
				dist[i][linkedNode.id] = 1;
			}

			// Initialise the array of distances 
			for (i = 0; i < n; i++) {

				dist[i] = [];

				// Initialise the path from node i to all the other nodes with INF
				for (j = 0; j < n; j++) {
					dist[i][j] = Number.MAX_VALUE;
				}

				// For each neighbor initialize the size of the path
				graph.forEachLinkedNode(i, initPathSize);

			}

			// FloydWarshall
			for (k = 0; k < n; k++) {
				for (i = 0; i < n; i++) {
					for (j = 0; j < n; j++) {
						dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
					}
				}
			}

			end = perf.now();

			// Return the right answer based on the allPaths paramter
			if (allPaths) {
				return [dist, end - start];
			} else {
				return [dist[sourceNodeId][targetNodeId], end - start];
			}
		}

		function dijktraShortestPath(sourceNodeId, targetNodeId) {

			var result = dijkstra(sourceNodeId),
				path = [],
				u = targetNodeId;

			if (result[0] === Number.MAX_VALUE) {
				return [result, []];
			}

			while (result[2][u] !== -1) {
				path.push(u);
				u = result[2][u];
			}

			path.push(sourceNodeId);

			return [result, path];

		}

		function dijkstra(sourceNodeId) {

			var dist = [],
				previous = [],
				que = [],
				perf = window.performance,
				start = perf.now(),
				i,
				u,
				alt;

			function processNode(linkedNode) {
				alt = dist[u] + 1;
				if (alt < dist[linkedNode.id]) {
					dist[linkedNode.id] = alt;
					previous[linkedNode.id] = u;
					que.splice(que.indexOf(linkedNode.id), 1);
					que.unshift(linkedNode.id);
				}
			}

			for (i = 0; i < n; i++) {
				dist[i] = Number.MAX_VALUE;
				previous[i] = -1;
				que.push(i);
			}

			dist[sourceNodeId] = 0;

			while (que.length > 0) {

				u = getSmallestValueIndex(dist, que);
				que.splice(que.indexOf(u), 1);
				if (dist[u] === Number.MAX_VALUE) {
					break;
				}
				graph.forEachLinkedNode(u, processNode);

			}

			return [dist, perf.now() - start, previous];

		}

		function getSmallestValueIndex(valueArray, array) {
			
			var smallest = array[0],
				i;

			for (i = 1; i < array.length; i++) {
				if (valueArray[array[i]] < valueArray[smallest]) {
					smallest = array[i];
				}
			}

			return smallest;

		}

		function averageGeodesicDistance(algo) {

			var sum = 0,
				time = 0,
				dist = 0,
				dists,
				result,
				i,
				j;

			// L = 1 / 0.5 N ( N - 1 )   sum( d(i,j) )   i =/= j

			if (algo === ShortestPathAlgo.FloydWarshall) {
				result = floydWarshall(0, 0, true);
				dists = result[0];
				time = result[1];
			}

			for (i = 0; i < n; i++) {

				if (algo === ShortestPathAlgo.Dijkstra) {
					result = dijkstra(i);
					dists = result[0];
					time += result[1];
				}

				for (j = i + 1; j < n; j++) {

					// Find shortest path between i and j
					if (algo === ShortestPathAlgo.BFS) {
						result = breadthFirstSearchDepth(i, j);
						dist = result[0];
						time += result[1];
					} else if (algo === ShortestPathAlgo.FloydWarshall) {
						dist = dists[i][j];
					} else if (algo === ShortestPathAlgo.Dijkstra) {
						dist = dists[j];
					}

					if (dist === Number.MAX_VALUE) {
						return [Infinity, time];
					}

					sum += dist;

				}
			}

			sum *= 1 / (0.5 * n * (n - 1));

			return [sum, time];

		}

		function networkPathEfficiency() {

			var sum = 0.0,
				noOfPaths = 0,
				dist = 0,
				dists,
				result,
				i,
				j;

			
			for (i = 0; i < n; i++) {

				result = dijkstra(i);
				dists = result[0];

				for (j = i + 1; j < n; j++) {

					dist = dists[j];
					
					if (dist != Number.MAX_VALUE) {
						sum += dist;
						++noOfPaths;
					}

				}
			}

			sum = sum / noOfPaths;

			return sum;

		}

		function create() {

			createNodes();
			createLinks();
			renderer.reset();

		}

		function clearLinks() {

			graph.forEachNode(function(node){
				while (node.links.length) {
					graph.removeLink(node.links[0]);
				}
			});

		}

		function createNodes() {

			// Remove all nodes and links
			graph.clear();
			nodeIDs.length = 0;

			for (var i = 0; i < n; i++) {
				graph.addNode(i);
				nodeIDs.push(i);
			}

		}

		function randomRewire() {

			var i;

			function rewire(linkedNode, link){

				var existingTargets,
					possibleTargets;

				// ...with probability p...
				if (randomness.rand() < p) {

					rewires++;

					graph.removeLink(link);

					// ...to a randomly chosen node
					existingTargets = graph.getLinks(i).map(function(link){
						return (link.fromId === i ? link.toId : link.fromId);
					});
					possibleTargets = nodeIDs.filter(function(id){
						return existingTargets.indexOf(id) < 0 && id !== i;
					});

					if (possibleTargets.length > 0) {

						graph.addLink(i, possibleTargets[~~(randomness.rand() * possibleTargets.length)], true);

					} else {

						console.log("hmm...?");

					}

				}

			}

			// Randomly rewire links...
			rewires = 0;
			for (i = 0; i < n; i++) {
				graph.forEachLinkedNode(i, rewire);
			}

		}

		function addRandomLinks(quantity) {

			var i,
				j,
				m,
				possible = [];

			for (i = 0; i < n; i++) {
				for (j = i + 1; j < n; j++) {
					if (!graph.hasLink(i, j) && !(graph.hasLink(j, i))) {
						possible.push([i, j]);
					}
				}
			}

			m = Math.min(possible.length, quantity);

			possible.sort(function() {
				return 0.5 - randomness.rand();
			});

			for (i = 0; i < m; i++) {

				// ...with probability p...
				if (randomness.rand() < p) {
					graph.addLink(possible[i][0], possible[i][1]);
				}

			}

		}

		function createLinks() {

			var i,
				j,
				target;

			clearLinks();

			// Create a regular nearest-neighbour coupled network
			for (i = 0; i < n; i++) {
				for (j = 1; j <= (k/2); j++) {
					target = (i + j) % n;
					if (i !== target && graph.hasLink(i, target) === null && graph.hasLink(target, i) === null) {
						graph.addLink(i, target);
					}
					target = i - j;
					target = target < 0 ? n + target : target;
					if (i !== target && graph.hasLink(i, target) === null && graph.hasLink(target, i) === null) {
						graph.addLink(i, target);
					}
				}
			}

			if (algo === SmallWorldAlgo.WattsStrogatz) {
				randomRewire();
			} else {
				addRandomLinks(s);
			}

			

		}

		function clusteringCoefficient() {

			var c = 0;

			// Ci = 2 ( ei / ki ( ki - 1 ) )
			// ki = degree of node i
			// ei = number of links between the ki neighbours of node i

			graph.forEachNode(function(fromNode){

				var ki = fromNode.links.length,
					ei = 0,
					adjacentNodes = [],
					i,
					j;

				if (ki > 1) {

					// Get adjacent nodes
					graph.forEachLinkedNode(fromNode.id, function(toNode) {
						adjacentNodes.push(toNode.id);
					});

					for (i = 0; i < ki; i++) {
						for (j = 0; j < ki; j++) {
							if (graph.hasLink(adjacentNodes[i], adjacentNodes[j])) {
								ei++;
							}
						}
					}

					c += 2 * ( ei / ( ki * (ki - 1)));

				}
				
			});

			return c / n;

		}

		function componentCount() {

			var count = 0,
				visited = [],
				i;

			// BFS from each un-visited node
			for (i = 0; i < n; i++) {
				if (visited.indexOf(i) === -1) {
					count++;
					visited = visited.concat(reachable(i));
				}
			}

			visited.length = 0;

			return count;

		}

		function setN(val) {
			n = val;
			create();
		}

		function setK(val) {
			k = val;
			create();
		}

		function setP(val) {
			p = val;
			createLinks();
		}

		function edgeCount() {
			return graph.getLinksCount();
		}

		function rewireCount() {
			return rewires;
		}

		return {
			init: init,
			createLinks: createLinks,
			setN: setN,
			setK: setK,
			setP: setP,
			edgeCount: edgeCount,
			rewireCount: rewireCount,
			averageGeodesicDistance: averageGeodesicDistance,
			breadthFirstSearchDepth: breadthFirstSearchDepth,
			networkPathEfficiency: networkPathEfficiency,
			getDegrees: getDegrees,
			dijktraShortestPath: dijktraShortestPath,
			clusteringCoefficient: clusteringCoefficient,
			addRandomLinks: addRandomLinks,
			reachable: reachable,
			componentCount: componentCount,
			clearHighlight: clearHighlight
		};

	})();

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
			} else {
				if (UI.wsAlgo.checked !== true) {
					UI.wsAlgo.checked = true;
					wsCheck();
				}
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

		result = SmallWorld.networkPathEfficiency();
		console.log(result);
		UI.effVal.innerHTML = "Network path efficiency: " + result.toFixed(2);	

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

	UI.fullScreen.addEventListener("click", function() {
		if (fullScreen.is()) {
			fullScreen.exit();
			UI.fullScreen.className = "enter";
		} else {
			fullScreen.enter();
			UI.fullScreen.className = "exit";
		}
	});

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

	function fullScreenChanged() {
		UI.fullScreen.className = fullScreen.is() ? "exit" : "enter";
	}

	document.addEventListener("fullscreenchange", fullScreenChanged, false);
	document.addEventListener("mozfullscreenchange", fullScreenChanged, false);
	document.addEventListener("webkitfullscreenchange", fullScreenChanged, false);
	document.addEventListener("MSFullscreenChange", fullScreenChanged, false);

	function hideInfo() {
		UI.info.className = UI.info.innerHTML = "";
	}

	function showNodeInfo(node, degree) {
		UI.info.className = "node";
		UI.info.innerHTML = "Node " + node + " has degree " + degree;
	}

	function showPathInfo(from, to, length) {
		UI.info.className = "path";
		if (length === 0) {
			UI.info.innerHTML = "Node " + to + " is not reachable from node " + from;
		} else {
			UI.info.innerHTML = "Shortest path from node " + from + " to node " + to + " is of length " + length;
		}
	}

	return SmallWorld;

}());