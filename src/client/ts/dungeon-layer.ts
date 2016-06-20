"use strict";

import * as Constants from "./constants";
import {EntityLayer}  from "./entity-layer";
import {GroundLayer}  from "./ground-layer";
import * as state     from "./state";
import {TweenHandler} from "./tween-handler";
import * as utils     from "./utils";

export class DungeonLayer extends PIXI.Container {
	public groundLayer: GroundLayer;
	public entityLayer: EntityLayer;
	public nextView: { r: [number, number], c: [number, number] };
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
			let center = {
				r: (this.nextView.r[0] + this.nextView.r[1]) / 2,
				c: (this.nextView.c[0] + this.nextView.c[1]) / 2
			};
			let newScale = Math.min(window.innerHeight / (this.nextView.r[1] - this.nextView.r[0]),
				window.innerWidth / (this.nextView.c[1] - this.nextView.c[0])) * .6 / Constants.GRID_SIZE;

			this.tweenHandler.tween(this.scale, "x", newScale, Constants.VIEW_MOVE_VELOCITY, "smooth");
			this.tweenHandler.tween(this.scale, "y", newScale, Constants.VIEW_MOVE_VELOCITY, "smooth");
			this.groundLayer.moveTo(center);
			this.entityLayer.moveTo(center);
		}

		return prm;
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