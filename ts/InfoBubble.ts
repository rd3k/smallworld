module App.UI {

	export class InfoBubble {

		private element:HTMLElement;

		Constructor(element:HTMLElement) {
			this.element = element;
		}

		Hide():void {
			this.element.className = this.element.innerHTML = "";
		}

		ShowNodeInfo(nodeId:Number, degree:Number):void {
			this.element.className = "node";
			this.element.innerHTML = "Node " + nodeId + " has degree " + degree;
		}

		ShowPathInfo(fromId:Number, toId:Number, length:Number):void {
			this.element.className = "path";
			if (length === 0) {
				this.element.innerHTML = "Node " + toId + " is not reachable from node " + fromId;
			} else {
				this.element.innerHTML = "Shortest path from node " + fromId + " to node " + toId + " is of length " + length;
			}
		}

	}

}