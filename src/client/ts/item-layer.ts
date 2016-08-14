"use strict";

import {AnimatedSprite} from "./graphics/animated-sprite";
import * as Constants   from "./constants";
import * as state       from "./state";
import {TweenHandler}   from "./tween-handler";
import * as utils       from "../../common/utils";

export class ItemLayer extends PIXI.Container {
	private tweenHandler: TweenHandler;

	constructor(tweenHandler: TweenHandler) {
		super();

		this.tweenHandler = tweenHandler;
	}

	update() {
		this.clear();

		for (let item of state.getState().items) {
			let graphics = this.generateGraphicsObject(item.graphics);
			[graphics.x, graphics.y] = utils.locationToCoordinates(item.location, Constants.GRID_SIZE);
			this.addChild(graphics);
		}
	}

	moveTo(loc: Crawl.Location): Thenable {
		let [x, y] = utils.locationToCoordinates(loc, Constants.GRID_SIZE);

		let xPrm = this.tweenHandler.tween(this, "x", -x, Constants.VIEW_MOVE_VELOCITY, "smooth");
		let yPrm = this.tweenHandler.tween(this, "y", -y, Constants.VIEW_MOVE_VELOCITY, "smooth");

		return Promise.all([xPrm, yPrm]);
	}

	clear(): void {
		this.removeChildren();
	}

	generateGraphicsObject(obj: Graphics.GraphicsObject): PIXI.DisplayObject {
		switch (obj.type) {
			case "static":
				let sgo: Graphics.StaticGraphicsObject = obj as Graphics.StaticGraphicsObject;
				let ret = new PIXI.Container();

				sgo.frames.reverse().forEach((frame) => {
					let sprite = PIXI.Sprite.fromFrame(sprintf("%s-%s", sgo.base, frame.texture));
					sprite.x = -frame.anchor.x;
					sprite.y = -frame.anchor.y;

					ret.addChild(sprite);
				});

				sgo.frames.reverse();

				return ret;

			case "animated":
				return new AnimatedSprite(obj.base, obj as Graphics.AnimatedGraphicsObject);
		}
	}
}