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

	constructor(tweenHandler: TweenHandler) {
		super();

		this.groundLayer = new GroundLayer(tweenHandler);
		this.entityLayer = new EntityLayer(tweenHandler);

		this.addChild(this.groundLayer);
		this.addChild(this.entityLayer);
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
			return Promise.all([prm, this.groundLayer.moveTo(to), this.entityLayer.moveTo(to)]);
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