var App;
(function (App) {

	var SmallWorldNetwork = (function () {

		function SmallWorldNetwork(args) {
			// ...
		}

		SmallWorldNetwork.prototype.showShortPath = function(from, to) {
			// ...
		}

		return SmallWorldNetwork;

	})();

})(App || (App = {}));

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
				existingTargets = graph.getLinks(i).map(function(link) {
					return (link.fromId === i ? link.toId : link.fromId);
				});
				possibleTargets = nodeIDs.filter(function(id) {
					return existingTargets.indexOf(id) < 0 && id !== i;
				});

				graph.addLink(i, possibleTargets[~~(randomness.rand() * possibleTargets.length)], true);

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

	function edgeCount() {
		return graph.getLinksCount();
	}

	function rewireCount() {
		return rewires;
	}

	return {
		init: init,
		edgeCount: edgeCount,
		rewireCount: rewireCount,
		averageGeodesicDistance: averageGeodesicDistance,
		breadthFirstSearchDepth: breadthFirstSearchDepth,
		getDegrees: getDegrees,
		dijktraShortestPath: dijktraShortestPath,
		clusteringCoefficient: clusteringCoefficient,
		reachable: reachable,
		componentCount: componentCount,
		clearHighlight: clearHighlight
	};

})();