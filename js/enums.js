var App;

(function (App) {

	(function (ShortestPathAlgo) {

		ShortestPathAlgo[ShortestPathAlgo.Dijkstra = 0] = "Dijkstra";
		ShortestPathAlgo[ShortestPathAlgo.BFS = 1] = "BFS";
		ShortestPathAlgo[ShortestPathAlgo.FloydWarshall = 2] = "FloydWarshall";

	})(App.ShortestPathAlgo || (App.ShortestPathAlgo = {}));

	(function (SmallWorldAlgo) {

		SmallWorldAlgo[SmallWorldAlgo.WattsStrogatz = 0] = "WattsStrogatz";
		SmallWorldAlgo[SmallWorldAlgo.NewmannWatts = 1] = "NewmannWatts";

	})(App.SmallWorldAlgo || (App.SmallWorldAlgo = {}));

})(App || (App = {}));