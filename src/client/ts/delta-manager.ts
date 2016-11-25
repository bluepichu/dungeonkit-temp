"use strict";

import {
	Container,
	Text
} from "pixi.js";

import Colors       from "./colors";
import Constants    from "./constants";
import * as Tweener from "./graphics/tweener";
import * as utils   from "../../common/utils";

export default class DeltaManager {
	private container: Container;

	public constructor(container: Container) {
		this.container = container;
	}

	public displayDelta(location: CrawlLocation, color: number, amount: number): Thenable {
		let delta = new Text((amount > 0 ? "+" : "") + amount,
			{
				fontFamily: "Lato",
				fontSize: "8px",
				fontWeight: "500",
				fill: color,
				stroke: Colors.BLACK,
				strokeThickness: 2,
				lineJoin: "round"
			}
		);

		delta.resolution = 20; // sometimes, we zoom in a lot on this
		delta.anchor.x = .5;
		delta.anchor.y = 1;
		Object.assign(delta, utils.locationToPoint(location, Constants.GRID_SIZE));
		delta.y -= Constants.GRID_SIZE / 2;

		this.container.addChild(delta);

		return Tweener.tween(delta, { y: delta.y - 3 * Constants.GRID_SIZE  / 16}, 0.1)
				.then(() => Tweener.tween(delta, { y: delta.y - Constants.GRID_SIZE / 16, alpha: 0 }, 0.1))
				.then(() => this.container.removeChild(delta));
	}
}