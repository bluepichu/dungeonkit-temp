"use strict";

import Colors       from "./colors";
import Constants    from "./constants";
import * as Tweener from "./graphics/tweener";
import * as utils   from "../../common/utils";

export default class DeltaManager {
	private container: PIXI.Container;

	public constructor(container: PIXI.Container) {
		this.container = container;
	}

	public displayDelta(location: CrawlLocation, color: number, amount: number): Thenable {
		let delta = new PIXI.Text((amount > 0 ? "+" : "") + amount, { font: "500 8px Lato", fill: color, stroke: Colors.BLACK, strokeThickness: 2 });
		delta.resolution = 20; // sometimes, we zoom in a lot on this
		delta.anchor.x = .5;
		delta.anchor.y = 1;
		Object.assign(delta, utils.locationToPoint(location, Constants.GRID_SIZE));
		delta.y -= Constants.GRID_SIZE / 2;

		this.container.addChild(delta);

		return Tweener.tween(delta, { y: delta.y - Constants.GRID_SIZE  / 4}, 0.1)
				.then(() => this.container.removeChild(delta));
	}
}