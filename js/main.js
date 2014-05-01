"use strict";

google.load("visualization", "1", {packages:["corechart"]});

var chart,
	chartOptions = {
		legend: {"position": "none"},
		width: 300,
		backgroundColor: { fill: "transparent" },
		colors: ["#444"],
		vAxis: {ticks: [], title: "Number of nodes"},
		hAxis: {title: "Degree", tickshowTextEvery: 1, baselineColor: 'transparent', gridlines: {color: 'transparent'}, minorGridlines: {count: 0}, slantedText: false},
		chartArea: {left:30, top:30, width: 260, height: 220}
	};

google.setOnLoadCallback(drawChart);

function drawChart() {

	chart = new google.visualization.ColumnChart(UI.degreeChart);

	var chartData = [['Degree', 'Quantity']];

	var degrees = SmallWorld.getDegrees();
	var max = 0, maxd = 0;

	for (var d in degrees) {
		chartData.push([d,  degrees[d]]);
		if (degrees[d] > max) {
			max = degrees[d];
		}
		if (+d > maxd) {
			maxd = +d;
		}
	}

	var data = google.visualization.arrayToDataTable(chartData);

	chartOptions.vAxis.ticks = [];
	for (var i = 0; i <= max; i++) {
		chartOptions.vAxis.ticks.push(i);
	}

	chartOptions.hAxis.ticks = [];
	for (var i = 0; i <= maxd; i++) {
		chartOptions.hAxis.ticks.push(i);
	}

	chart.draw(data, chartOptions);

}



Array.prototype.remove = function(val) {
	var idx = this.indexOf(val);
	if (idx != -1) {
		return this.splice(idx, 1);
	}
	return false;
}

var rand = function () {
	//var vivaRand = Viva.random(123);
	return Math.random();
	//return vivaRand.nextDouble();
}

var n = 10, k = 2 , p = 0;

var SmallWorld = (function () {

	var graph = Viva.Graph.graph(),
		layout = Viva.Graph.Layout.constant(graph),
		graphics = Viva.Graph.View.svgGraphics(),
		renderer = Viva.Graph.View.renderer(graph, {
			layout: layout,
			graphics : graphics,
			interactive: false
		}),
		n, k, p,
		rewires = 0,
		nodeIDs = [];

	// Draw as ring network
	layout.placeNode(function(node) {
		var angle = ((node.id / n) * 360) * (Math.PI / 180);
		return {x: (5 * n) * Math.cos(angle), y: (5 * n) * Math.sin(angle)};
	});

	// Circular nodes
	graphics.node(function(node) {

		var ui = Viva.Graph.svg("circle").attr('r', 5).attr("fill", "#000").attr("d", node.id);

		ui.addEventListener("mousedown", function(e) {
			//console.log(SmallWorld.breadthFirstSearchDepth(0, node.id));
			//console.log("mousedown node %o", node.id);
			console.log("Node %o has degree %o", node.id, graph.getLinks(node.id).length);
		});

		ui.addEventListener("mouseover", function(e) {
			var links = graph.getLinks(node.id);
			for (var i = 0, linkUI; i < links.length; i++) {
				linkUI = graphics.getLinkUI(links[i].id);
				if (linkUI) {
					linkUI.attr('stroke', 'red').attr('stroke-width', 2);
					graphics.getNodeUI(links[i].toId).attr('fill', 'red');
					graphics.getNodeUI(links[i].fromId).attr('fill', 'red');
				}
			};
			graphics.getNodeUI(node.id).attr('fill', '#990000');	
		});

		ui.addEventListener("mouseout", function(e) {
			var links = graph.getLinks(node.id);
			for (var i = 0, linkUI; i < links.length; i++) {
				linkUI = graphics.getLinkUI(links[i].id);
				if (linkUI) {
					linkUI.attr('stroke', '#999').attr('stroke-width', 1);
					graphics.getNodeUI(links[i].toId).attr('fill', '#000');
					graphics.getNodeUI(links[i].fromId).attr('fill', '#000');
				}
			};
			graphics.getNodeUI(node.id).attr('fill', '#000');
		});

		return ui;

	}).placeNode(function(nodeUI, pos){

		nodeUI.attr("cx", pos.x).attr("cy", pos.y);

	});

	function init(nVal, kVal, pVal) {

		n = nVal;
		k = kVal;
		p = pVal;
		renderer.run();
		create();

	}

	function getDegrees() {
		var degrees = {}, max = 0;
		graph.forEachNode(function(node){
			var degree = graph.getLinks(node.id).length;
			if (degrees.hasOwnProperty(degree)) {
				degrees[degree]++;
			} else {
				degrees[degree] = 1;
			}
			if (degree > max) {
				max = degree;
			}
		});
		for (var i = 0; i < max; i++) {
			if (!degrees.hasOwnProperty(i)) {
				degrees[i] = 0;
			}
		}
		return degrees;
	}

	// THIS DOES NOT WORK PROPERLY
	// DEPTH IS NOT CORRECT
	function breadthFirstSearchDepth(sourceNodeId, targetNodeId) {

		var visitQueue = [], visited = [], depths = [], t;
		var steps = 0;

		visitQueue.push(sourceNodeId);
		visited.push(sourceNodeId);
		depths.push(0);

		while (visitQueue.length > 0) {

			t = visitQueue.shift();
			steps++;
			if (t === targetNodeId) {
				return [depths[visited.indexOf(t)], steps];

			}

			graph.forEachLinkedNode(t, function(linkedNode, link){

				if (visited.indexOf(linkedNode.id) === -1) {
					visited.push(linkedNode.id);
					depths.push(depths[visited.indexOf(t)] + 1);
					visitQueue.push(linkedNode.id);
				}

			});

		}

		return [Number.MAX_VALUE, steps];
	}

	/*
	*  Returns the lenght of the shorthest path between the source node and the destination node
	*  calculated using the Floyd–Warshall algorithm
	*
	*  @author Marius Popescu
	*
	*  @param Boolean allPaths - true if the method should return all a matrix will all the paths, false to return only the lenght of the required path
	*  @param int sourceNodeId - starting node
	*  @param int targetNodeId - destination node
	*  @return [dist, steps]
	*/
	function floydWarshall(sourceNodeId, targetNodeId, allPaths)
	{
		var INF = Number.MAX_VALUE;
		var dist = []; 
		var steps = 0;

		// Initialize the array of distances 
		for(var i = 0; i < n; ++i)
	    {
	    	dist[i] = [];

	    	// Initialize the path from node i to all the other nodes with INF
	    	for (var j = 0; j < n; ++j)
	    	{
	    		dist[i][j] = INF;
	    	}
	    	
	    	// For each neighbor initialize the size of the path
	    	graph.forEachLinkedNode(i, function(linkedNode, link){
				dist[i][linkedNode.id] = 1;
			}); 
	    }

	    // FloydWarshall
		for (var k = 0; k < n; ++k)
       		for(var i = 0; i < n; ++i)
            	for(var j = 0; j < n; ++j)
            	{
                	dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
            		++steps;
            	}
	    

	    // Return the right answer based on the allPaths paramter
	    if (allPaths) 
	    {
	    	return [dist, steps];
	    }
	    else 
	    {
	    	if (dist[sourceNodeId][targetNodeId] == INF)
	    		return -1;
	    	return [dist[sourceNodeId][targetNodeId], steps];
	    }
	}

	function DijktraShortestPath(sourceNodeId, targetNodeId)
	{
		return Dijkstra(sourceNodeId)[targetNodeId];
	}
	function Dijkstra(sourceNodeId) {
		var dist = [], previous = [], que = [];
		var INF = Number.MAX_VALUE;
		var steps = 0;
		for (var i = 0; i < n; i++) {
			dist[i] = INF;
			previous[i] = -1;
			que.push(i);
		}
		dist[sourceNodeId] = 0;
		while(que.length > 0){
			steps ++;
			var u = getSmallestValueIndex(dist,que);
			que.splice(que.indexOf(u),1);
			if(dist[u] == INF){
				break;
			}
			graph.forEachLinkedNode(u, function(linkedNode, link){
				var alt = dist[u] + 1;
				if(alt < dist[linkedNode.id]){
					dist[linkedNode.id] = alt;
					previous[linkedNode.id] = u;
					que.splice(que.indexOf(linkedNode.id),1);
					que.unshift(linkedNode.id);
				}
			}); 
		}
		//printArray(dist);
		return [dist, steps];
	}
	function printArray(array){
		for(var i = 0; i < array.length; i++)
			console.log(i + ": " + array[i]);
	}
	function getSmallestValueIndex(valueArray, array){
		var smallest = array[0];
		for(var i = 1; i < array.length; i++){
			if(valueArray[array[i]] < valueArray[smallest])
				smallest = array[i];
		}
		return smallest;
	}

	// mode = 'BFS' for Breadth First Search
	// mode = "FW" for Floyd Warshall
	// mode = "DJK" for Dijstrak
	function averageGeodesicDistance(mode) {

		var sum = 0;

		/*

		L =         1
		    ----------------  sum ( d(i,j) )   i =/= j
		     0.5 N ( N - 1 )    i,j

		*/


		var dists;
		var steps= 0;
		var result;
		if (mode == 'FW')
		{
			result = floydWarshall(0,0,true);
			dists = result[0];
			steps = result[1];
		}

		var dist = 0;
		var noOfEdges = 0;
		for (var i = 0; i < n; i++) {

			if (mode == "DJK")
			{
				result = Dijkstra(i);
				dists = result[0];
				steps += result[1];
			}

			for (var j = i + 1; j < n; j++) {
				
				// Find shortest path between i and j
				if (mode == 'BFS') {
					 result = breadthFirstSearchDepth(i, j);
					 dist = result[0];
					 steps += result[1];
				}
				else if (mode == "FW") {
					dist = dists[i][j];
				}
				else if (mode == "DJK") {
					dist = dists[j];
				} 

				if (dist == Number.MAX_VALUE)
					return [Infinity, Infinity];
				
				sum += dist;	
				
			}
		}
		
		sum *= 1 / (0.5 * n * (n-1));

		return [sum, steps];

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
		nodeIDs = [];

		for (var i = 0; i < n; i++) {
			graph.addNode(i);
			nodeIDs.push(i);
		}

	}

	function randomRewire() {

		// Randomly rewire links...
		rewires = 0;
		for (var i = 0; i < n; i++) {

			graph.forEachLinkedNode(i, function(linkedNode, link){

				// ...with probability p...
				if (rand() < p) {

					rewires++;

					graph.removeLink(link);

					// ...to a randomly chosen node
					var existingTargets = graph.getLinks(i).map(function(link){return (link.fromId == i ? link.toId : link.fromId)});
					var possibleTargets = nodeIDs.filter(function(id){return existingTargets.indexOf(id) < 0 && id != i});

					if (possibleTargets.length > 0) {

						var target = possibleTargets[~~(Math.random() * possibleTargets.length)];
						graph.addLink(i, target, true);

					} else {

						console.log('hmm...?');

					}

				}

			});

		}

	}

	function createLinks() {

		document.body.className = "loading";

		setTimeout(function(){

			clearLinks();

			// Create a regular nearest-neighbour coupled network
			for (var i = 0; i < n; i++) {
				for (var j = 1, t; j <= (k/2); j++) {
					var target = (i + j) % n;
					if (i !== target && graph.hasLink(i, target) === null && graph.hasLink(target, i) === null) {
						graph.addLink(i, target);
					}
					t = i - j;
					target = t < 0 ? n + t : t;
					if (i !== target && graph.hasLink(i, target) === null && graph.hasLink(target, i) === null) {
						graph.addLink(i, target);
					}
				}
			}

			randomRewire();

			document.body.className = "";

		}, 1);

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
		getDegrees: getDegrees,
		DijktraShortestPath: DijktraShortestPath
	};

})();

var UI = {
	pChanger: document.getElementById("pChanger"),
	pVal: document.getElementById("pVal"),
	nChanger: document.getElementById("nChanger"),
	nVal: document.getElementById("nVal"),
	kChanger: document.getElementById("kChanger"),
	kVal: document.getElementById("kVal"),
	edgesVal: document.getElementById("edgesVal"),
	rewireVal: document.getElementById("rewireVal"),
	degreeChart: document.getElementById("degreeChart"),
	dijkstraLVal: document.getElementById("dijkstraLVal"),
	bfsLVal: document.getElementById("bfsLVal"),
	fwVal: document.getElementById("fwVal"),
};

function readHash() {

	var hash = window.location.hash.replace("#", "");
	if (hash !== "") {

		hash = hash.split("|");
		if(hash.length === 3) {
			n = parseInt(hash[0]);
			k = parseInt(hash[1]);
			p = parseFloat(hash[2]);
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

	}

}

function updateEdgeCount() {
	setTimeout(function(){
		UI.edgesVal.innerHTML = SmallWorld.edgeCount() + " edges";
	});
}

function updateRewireCount() {
	setTimeout(function(){
		UI.rewireVal.innerHTML = SmallWorld.rewireCount() + " rewires";
	});
}

function updateL() {
	setTimeout(function(){
		var result = SmallWorld.averageGeodesicDistance('DJK');
		UI.dijkstraLVal.innerHTML = "Dijkstra L = " + result[0].toFixed(2) + " S = " + result[1];

		result = SmallWorld.averageGeodesicDistance('BFS');
		UI.bfsLVal.innerHTML = "BFS L = " + result[0].toFixed(2) + " S = " + result[1];

		result = SmallWorld.averageGeodesicDistance('FW');
		UI.fwVal.innerHTML = "FW L = " + result[0].toFixed(2) + " S = " + result[1];
	});
}

function updateHash() {
	window.location.hash = UI.nVal.innerHTML + "|" + UI.kVal.innerHTML + "|" + UI.pVal.innerHTML;
}

function init() {

	readHash();

	UI.nVal.innerHTML = n;
	UI.nChanger.value = n;

	UI.kVal.innerHTML = k;
	UI.kChanger.value = k;

	UI.pVal.innerHTML = p;
	UI.pChanger.value = p;

	SmallWorld.init(n, k, p);

	updateHash();
	updateEdgeCount();
	updateRewireCount();
	updateL();

}

UI.nChanger.addEventListener("change", function(e) {
	var n = e.target.valueAsNumber;
	UI.nVal.innerHTML = n;
	updateEdgeCount();
	updateRewireCount();
	updateHash();
	drawChart();
});
UI.nChanger.addEventListener("input", function(e) {
	UI.nVal.innerHTML = e.target.valueAsNumber;
});

UI.kChanger.addEventListener("change", function(e) {
	var k = e.target.valueAsNumber;
	UI.kVal.innerHTML = k;
	updateEdgeCount();
	updateRewireCount();
	updateHash();
	drawChart();
});
UI.kChanger.addEventListener("input", function(e) {
	UI.kVal.innerHTML = e.target.valueAsNumber;
});

UI.pChanger.addEventListener("change", function(e) {
	var p = e.target.valueAsNumber;
	UI.pVal.innerHTML = p;
	updateEdgeCount();
	updateRewireCount();
	updateHash();
	drawChart();
});
UI.pChanger.addEventListener("input", function(e) {
	UI.pVal.innerHTML = e.target.valueAsNumber;
});

document.body.addEventListener('keyup', function(e) {
	if (e.which === 32) {
		SmallWorld.createLinks();
		updateRewireCount();
		drawChart();
	}
});

window.addEventListener("hashchange", function() {
	init();
}, false);

init();
