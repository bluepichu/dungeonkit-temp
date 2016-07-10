"use strict";

import {AnimatedSprite} from "./graphics/animated-sprite";
import * as Constants   from "./constants";
import * as state       from "./state";
import {TweenHandler}   from "./tween-handler";
import * as utils       from "../../common/utils";

export class GroundLayer extends PIXI.Container {
	private tweenHandler: TweenHandler;
	private tileLayer: PIXI.Container;
	private lightingLayer: PIXI.Container;

	constructor(tweenHandler: TweenHandler) {
		super();

		this.tweenHandler = tweenHandler;

		this.tileLayer = new PIXI.Container();
		this.addChild(this.tileLayer);

		this.lightingLayer = new PIXI.Container();
		this.addChild(this.lightingLayer);
	}

	update(location: Game.Crawl.Location) {
		for (let i = location.r - 1; i <= location.r + 1; i++) {
			for (let j = location.c - 1; j <= location.c + 1; j++) {
				if (i < 0 || i >= state.getState().floor.map.height || j < 0 || j >= state.getState().floor.map.width) {
					continue;
				}

				let tile = this.getFloorTile(state.getState().floor.map, { r: i, c: j }, state.getState().dungeon.graphics);

				if (tile === undefined) {
					continue;
				}

				let dtile = tile as PIXI.DisplayObject;

				[dtile.x, dtile.y] = utils.locationToCoordinates({ r: i, c: j }, Constants.GRID_SIZE);
				this.tileLayer.addChild(dtile);
			}
		}
	}

	moveTo(loc: Game.Crawl.Location): Thenable {
		let [x, y] = utils.locationToCoordinates(loc, Constants.GRID_SIZE);

		let xPrm = this.tweenHandler.tween(this, "x", -x, Constants.VIEW_MOVE_VELOCITY, "smooth");
		let yPrm = this.tweenHandler.tween(this, "y", -y, Constants.VIEW_MOVE_VELOCITY, "smooth");

		return Promise.all([xPrm, yPrm]);
	}

	private getFloorTile(map: Game.Crawl.Map,
		loc: Game.Crawl.Location,
		graphics: Game.Graphics.DungeonGraphics): PIXI.DisplayObject | void {
		if (utils.getTile(map, loc).type === Game.Crawl.DungeonTileType.UNKNOWN) {
			return undefined;
		}

		if (utils.getTile(map, loc).type === Game.Crawl.DungeonTileType.FLOOR) {
			return this.generateGraphicsObject(graphics.base, graphics.open);
		}

		let pattern = 0;

		for (let i = 0; i < 8; i++) {
			let [dr, dc] = utils.decodeDirection(i);

			pattern <<= 1;
			let [r, c] = [loc.r + dr, loc.c + dc];

			if (0 <= r && r < map.height && 0 <= c && c < map.width) {
				switch (utils.getTile(map, { r, c }).type) {
					case Game.Crawl.DungeonTileType.UNKNOWN:
						return undefined;

					case Game.Crawl.DungeonTileType.WALL:
						pattern |= 1;
				}
			} else {
				pattern |= 1;
			}
		}

		if (map.grid[loc.r][loc.c].stairs) {
			return this.generateGraphicsObject(graphics.base, graphics.stairs);
		}

		for (let i = 0; i < graphics.walls.length; i++) {
			if ((graphics.walls[i].pattern & pattern) === graphics.walls[i].pattern) {
				return this.generateGraphicsObject(graphics.base, graphics.walls[i].object);
			}
		}
	}

	clear(): void {
		this.tileLayer.removeChildren();
		this.lightingLayer.removeChildren();
	}

	generateGraphicsObject(base: string, obj: Game.Graphics.GraphicsObject): PIXI.DisplayObject {
		switch (obj.type) {
			case "static":
				let sgo: Game.Graphics.StaticGraphicsObject = obj as Game.Graphics.StaticGraphicsObject;
				let ret = new PIXI.Container();

				sgo.frames.reverse().forEach((frame) => {
					let sprite = PIXI.Sprite.fromFrame(sprintf("%s-%s", base, frame.texture));
					sprite.x = -frame.anchor.x;
					sprite.y = -frame.anchor.y;

					ret.addChild(sprite);
				});

				sgo.frames.reverse();

				return ret;

			case "animated":
				return new AnimatedSprite(base, obj as Game.Graphics.AnimatedGraphicsObject);
		}
	}

	updateVisibility(): void {
		// this.lightingLayer.removeChildren();

		// for (let i = 0; i < state.getState().floor.map.height; i++) {
		// 	for (let j = 0; j < state.getState().floor.map.width; j++) {
		// 		if (!utils.isVisible(state.getState().floor.map, state.getState().self.location, { r: i, c: j })) {
		// 			let child = new PIXI.Graphics();
		// 			child.beginFill(0x000000, .8);
		// 			child.drawRect(0, 0, Constants.GRID_SIZE, Constants.GRID_SIZE);
		// 			child.endFill();
		// 			[child.x, child.y] = utils.locationToCoordinates({ r: i, c: j }, Constants.GRID_SIZE);
		// 			this.lightingLayer.addChild(child);
		// 		}
		// 	}
		// }
	}
}