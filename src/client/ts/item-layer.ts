"use strict";

import * as Constants      from "./constants";
import {GraphicsObject}    from "./graphics/graphics-object";
import * as state          from "./state";
import * as utils          from "../../common/utils";

export class ItemLayer extends PIXI.Container {
	constructor() {
		super();
	}

	update() {
		this.clear();

		for (let item of state.getState().items) {
			let graphics = new GraphicsObject(item.graphics);
			let {x, y} = utils.locationToPoint(item.location, Constants.GRID_SIZE);
			graphics.x = x;
			graphics.y = y;
			this.addChild(graphics);
		}
	}

	clear(): void {
		this.removeChildren();
	}
}