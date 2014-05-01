"use strict";

Array.prototype.remove = function(val) {
	var idx = this.indexOf(val);
	if (idx != -1) {
		return this.splice(idx, 1);
	}
	return false;
}

var rand = function () {
	var vivaRand = Viva.random(123);
	//return Math.random();
	return vivaRand.nextDouble();
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
					linkUI.attr('stroke', 'red');
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
					linkUI.attr('stroke', '#999');
					graphics.getNodeUI(links[i].toId).attr('fill', '#000');
					graphics.getNodeUI(links[i].fromId).attr('fill', '#000');
				}
			};
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
		graph.forEachNode(function(node){
			// ...
		});
	}

	// THIS DOES NOT WORK PROPERLY
	// DEPTH IS NOT CORRECT
	function breadthFirstSearchDepth(sourceNodeId, targetNodeId) {

		var visitQueue = [], visited = [], depth = 0, elementsToDepthIncrease = 1, nextElementsToDepthIncrease = 0, t;

		visitQueue.push(sourceNodeId);
		visited.push(sourceNodeId);

		while (visitQueue.length > 0) {

			t = visitQueue.pop();

			if (t === targetNodeId) {

				return depth;

			}

			nextElementsToDepthIncrease += graph.getLinks(t).length;
			if (--elementsToDepthIncrease == 0) {
				depth++;
				elementsToDepthIncrease = nextElementsToDepthIncrease;
				nextElementsToDepthIncrease = 0;
			}

			graph.forEachLinkedNode(t, function(linkedNode, link){

				if (visited.indexOf(linkedNode.id) === -1) {
					visited.push(linkedNode.id);
					visitQueue.unshift(linkedNode.id);
				}

			});

		}

		return -1;

	}

	function averageGeodesicDistance() {

		var sum = 0;

		/*

		L =         1
		    ----------------  sum ( d(i,j) )   i =/= j
		     0.5 N ( N - 1 )    i,j

		*/

		for (var i = 0; i < n; i++) {
			for (var j = 0; j < n; j++) {
				if (i != j) {

					// Find shortest path between i and j
					sum += breadthFirstSearchDepth(i, j);

				}
			}
		}

		sum *= 1 / (0.5 * n * (n - 1));

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
    	breadthFirstSearchDepth: breadthFirstSearchDepth
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

}

UI.nChanger.addEventListener("change", function(e) {
	var n = e.target.valueAsNumber;
	//SmallWorld.setN(n);
	UI.nVal.innerHTML = n;
	updateEdgeCount();
	updateRewireCount();
	updateHash();
});
UI.nChanger.addEventListener("input", function(e) {
	UI.nVal.innerHTML = e.target.valueAsNumber;
});

UI.kChanger.addEventListener("change", function(e) {
	var k = e.target.valueAsNumber;
	//SmallWorld.setK(k);
	UI.kVal.innerHTML = k;
	updateEdgeCount();
	updateRewireCount();
	updateHash();
});
UI.kChanger.addEventListener("input", function(e) {
	UI.kVal.innerHTML = e.target.valueAsNumber;
});

UI.pChanger.addEventListener("change", function(e) {
	var p = e.target.valueAsNumber
	//SmallWorld.setP(p);
	UI.pVal.innerHTML = p;
	updateEdgeCount();
	updateRewireCount();
	updateHash();
});
UI.pChanger.addEventListener("input", function(e) {
	UI.pVal.innerHTML = e.target.valueAsNumber;
});

document.body.addEventListener('keyup', function(e) {
	if (e.which === 32) {
		SmallWorld.createLinks();
		updateRewireCount();
	}
});

window.addEventListener("hashchange", init, false);

init();