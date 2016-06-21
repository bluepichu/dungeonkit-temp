"use strict";

import * as Constants from "./constants";
import {EntityLayer}  from "./entity-layer";
import {GroundLayer}  from "./ground-layer";
import * as state     from "./state";
import {TweenHandler} from "./tween-handler";
import * as utils     from "../../common/utils";

export class DungeonLayer extends PIXI.Container {
	public groundLayer: GroundLayer;
	public entityLayer: EntityLayer;
	public tweenHandler: TweenHandler;

	constructor(tweenHandler: TweenHandler) {
		super();

		this.groundLayer = new GroundLayer(tweenHandler);
		this.entityLayer = new EntityLayer(tweenHandler);

		this.addChild(this.groundLayer);
		this.addChild(this.entityLayer);

		this.tweenHandler = tweenHandler;
	}

	init(): void {
		let [offsetX, offsetY] = utils.locationToCoordinates(state.getState().self.location, Constants.GRID_SIZE);

		[this.groundLayer.x, this.groundLayer.y] = [-offsetX, -offsetY];
		[this.entityLayer.x, this.entityLayer.y] = [-offsetX, -offsetY];
	}

	moveEntity(entity: Game.Crawl.CondensedEntity,
		from: Game.Crawl.Location,
		to: Game.Crawl.Location,
		isSelf: boolean,
		animation?: string,
		direction?: number): Thenable {
		let prm = this.entityLayer.moveEntity(entity, from, to);
		this.entityLayer.setEntityAnimation(entity.id, animation, direction);

		if (isSelf) {
			this.updatePosition(to);
		}

		return prm;
	}

	updatePosition(entityLocation: Game.Crawl.Location): void {
		let nextView = {
			r: [entityLocation.r, entityLocation.r],
			c: [entityLocation.c, entityLocation.c]
		};

		let inRoom = utils.getTile(state.getState().floor.map, entityLocation).roomId > 0;

		for (let i = 0; i < state.getState().floor.map.height; i++) {
			for (let j = 0; j < state.getState().floor.map.width; j++) {
				if (utils.isVisible(state.getState().floor.map, entityLocation, { r: i, c: j })) {
					console.log(i, j, inRoom);
					nextView.r[0] = Math.min(nextView.r[0], i);
					nextView.r[1] = Math.max(nextView.r[1], i);
					nextView.c[0] = Math.min(nextView.c[0], j);
					nextView.c[1] = Math.max(nextView.c[1], j);
				}
			}
		}

		console.log(nextView.r, nextView.c);

		let center = {
			r: (nextView.r[0] + nextView.r[1]) / 2,
			c: (nextView.c[0] + nextView.c[1]) / 2
		};

		let newScale = Math.min(window.innerHeight / (nextView.r[1] - nextView.r[0]),
			window.innerWidth / (nextView.c[1] - nextView.c[0])) * .8 / Constants.GRID_SIZE;

		newScale = Math.min(newScale, 4);

		this.tweenHandler.tween(this.scale, "x", newScale, Constants.VIEW_MOVE_VELOCITY, "smooth");
		this.tweenHandler.tween(this.scale, "y", newScale, Constants.VIEW_MOVE_VELOCITY, "smooth");
		this.groundLayer.moveTo(center);
		this.entityLayer.moveTo(center);
	}

	showAnimationOnce(entityId: string, animation: string, direction?: number): Thenable {
		this.entityLayer.setEntityAnimation(entityId, animation, direction);
		return new Promise((resolve, _) => this.entityLayer.setAnimationEndListener(entityId, resolve));
	}

	getEntityDirection(entityId: string): number {
		return this.entityLayer.spriteMap.get(entityId).direction;
	}

	clear(): void {
		this.groundLayer.clear();
		this.entityLayer.clear();
	}
}