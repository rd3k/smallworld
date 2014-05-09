// Type definitions for VivaGraphJS

declare module Viva {
	
	export module Graph {

		export interface centrality {

			betweennessCentrality(graph:any):Array<any>
			degreeCentrality(graph:any, kind:any):Array<any>

		}

		export interface community {

			slpa(graph:any, T:any, r:any):any

		}

		export interface generator {

			complete(n:Number):graph
			completeBipartite(n:Number, m:Number):graph
			ladder(n:Number):graph
			circularLadder(n:Number):graph
			grid(n:Number, m:Number):graph
			path(n:Number):graph
			lollipop(m:Number, n:Number):graph
			balancedBinTree(n:Number):graph
			randomNoLinks(n:Number):graph

		}

		export interface graph {

			addNode(nodeId:Number, data:any):Node
			addLink(fromId:Number, toId:Number, data:any):Link
			removeLink(link:Link):Boolean
			removeNode(nodeId:Number):Boolean
			getNode(nodeId:Number):Node
			getNodesCount():Number
			getLinksCount():Number
			getLinks():Array<Link>
			// ...

		}

		export interface operations {

			density(graph:graph, directed:Boolean):Number

		}

		export interface serializer {

			storeToJSON(graph, nodeTransform, linkTransform)
			loadFromJSON(jsonString, nodeTransform, linkTransform):graph

		}

		export module Layout {

			interface LinkPosition {
				from:any
				to:any
			}

			export class constant {

				Constructor(graph:graph, userSettings)
				run(iterationsCount:Number):void
				step():Boolean
				getGraphRect():Rect
				dispose():void
				isNodePinned(node:Node):Boolean
				pinNode(node:Node, isPinned:Boolean):void
				getNodePosition(nodeId:Number):any
				getLinkPosition(link:Link):LinkPosition
				setNodePosition(node:Node, x:Number, y:Number):void
				placeNode(newPlaceNodeCallbackOrNode:(node) => {}):constant
				placeNode(newPlaceNodeCallbackOrNode:Node)

			}

			export class forceDirected {

				Constructor(graph:graph, settings)
				run(iterationsCount:Number):void
				step():Boolean
				isNodePinned(node:Node):Boolean
				pinNode(node:Node, isPinned:Boolean):void
				getNodePosition(nodeId:Number):any
				getLinkPosition(link:Link):LinkPosition
				setNodePosition(node:Node, x:Number, y:Number):void
				getGraphRect():Rect
				dispose():void
				springLength(length:Number):Number
				springCoeff(coeff:Number):Number
				gravity(g:Number):Number
				theta(t:Number):Number
				drag(dragCoeff:Number):Number

			}

		}

		export module Physics {

			// ...

		}

		export interface svg {

			// ...

		}

		export class Rect {

			Constructor(x1:Number, y1:Number, x2:Number, y2:Number)
			public x1:Number
			public y1:Number
			public x2:Number
			public y2:Number

		}

		export class Point2d {

			Constructor(x:Number, y:Number)
			public x:Number
			public y:Number

		}

		export class Node {

			Constructor(id:Number)
			public id:Number
			public links:Array<Link>
			public data:any

		}

		export class Link {

			Constructor(fromId:Number, toId:Number, data:any, id:Number)
			public fromId:Number
			public toId:Number
			public data:any
			public id:Number

		}

		export module View {

			export interface cssGraphics {

				node(builderCallbackOrNode:(node:Node) => {}):cssGraphics
				node(builderCallbackOrNode:Node):HTMLElement
				link(builderCallbackOrNode:(link:Link) => {}):cssGraphics
				link(builderCallbackOrNode:Link):HTMLElement
				inputManager:Viva.Input.domInputManager
				graphCenterChanged(x:Number, y:Number):void
				translateRel(dx:Number, dy:Number):void
				scale(x:Number, y:Number):Number
				resetScale():cssGraphics
				// ...

			}

		}

	}

	export module Input {

		interface DragDropHandles {
			onStart()
			onDrag(e, offset)
			onStop()
		}

		export class domInputManager {

			Constructor(graph:Graph.graph, graphics)
			bindDragNDrop(node:Graph.Node, handlers:DragDropHandles)

		}

		export class webglInputManager {

			Constructor(graph:Graph.graph, graphics)
			bindDragNDrop(node:Graph.Node, handlers:DragDropHandles)

		}

	}

	export interface BrowserInfo {

		browser:String
		version:String

	}

	export function lazyExtend(target, options)

	export interface random {

		next(maxValue:Number):Number
		nextDouble():Number

	}

	export class randomIterator {

		Constructor(array:Array<any>, random)
		forEach(callback:(item) => {})
		shuffle():Array<any>

	}

	export module Utils {

		// ...

		interface Rectangle {
			left:Number
			top:Number
			width:Number
			height:Number
		}

		export class dragndrop {

			Constructor(element:HTMLElement)
			onStart(callback:() => {}):dragndrop
			onDrag(callback:() => {}):dragndrop
			onStop(callback:() => {}):dragndrop
	        onScroll(callback:() => {}):dragndrop
	        release():void

		}		

		export function getDimension(container:HTMLElement):Rectangle
		export function findElementPosition(obj:HTMLElement):Array<Number>
		export function indexOfElementInArray(element:any, array:Array<any>):Number

		export interface timer {

			stop():void
			restart():void

		}

	}

	export interface geom {

		intersect(x1:Number, y1:Number, x2:Number, y2:Number, x3:Number, y3:Number, x4:Number, y4:Number):Graph.Point2d
		intersectRect(left:Number, top:Number, right:Number, bottom:Number, x1:Number, y1:Number, x2:Number, y2:Number):Graph.Point2d
		convexHull(points:Array<Graph.Point2d>):Array<Graph.Point2d>

	}

}