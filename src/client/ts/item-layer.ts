"use strict";

import {AnimatedSprite}    from "./graphics/animated-sprite";
import * as Constants      from "./constants";
import * as GraphicsObject from "./graphics/graphics-object";
import * as state          from "./state";
import {TweenHandler}      from "./tween-handler";
import * as utils          from "../../common/utils";

export class ItemLayer extends PIXI.Container {
	private tweenHandler: TweenHandler;

	constructor(tweenHandler: TweenHandler) {
		super();

		this.tweenHandler = tweenHandler;
	}

	update() {
		this.clear();

		for (let item of state.getState().items) {
			let graphics = GraphicsObject.generate(item.graphics);
			[graphics.x, graphics.y] = utils.locationToCoordinates(item.location, Constants.GRID_SIZE);
			this.addChild(graphics);
		}
	}

	moveTo(loc: CrawlLocation): Thenable {
		let [x, y] = utils.locationToCoordinates(loc, Constants.GRID_SIZE);

		let xPrm = this.tweenHandler.tween(this, "x", -x, Constants.VIEW_MOVE_VELOCITY, "smooth");
		let yPrm = this.tweenHandler.tween(this, "y", -y, Constants.VIEW_MOVE_VELOCITY, "smooth");

		return Promise.all([xPrm, yPrm]);
	}

	clear(): void {
		this.removeChildren();
	}
}