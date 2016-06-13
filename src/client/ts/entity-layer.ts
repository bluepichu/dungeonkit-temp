"use strict";

import * as Constants from "./constants";
import {EntitySprite} from "./graphics/entity-sprite";
import * as state     from "./state";
import {TweenHandler} from "./tween-handler";
import * as utils     from "./utils";

export class EntityLayer extends PIXI.Container {
	public static entityGraphicsCache: Game.Graphics.EntityGrpahicsCache = new Map();
	public spriteMap: Map<string, EntitySprite>;
	private tweenHandler: TweenHandler;

	constructor(tweenHandler: TweenHandler) {
		super();
		this.spriteMap = new Map();
		this.tweenHandler = tweenHandler;
	}

	update() {
		let keys: Set<string> = new Set(this.spriteMap.keys());

		state.getState().entities.forEach((entity) => {
			keys.delete(entity.id);

			if (this.spriteMap.has(entity.id)) {
				let entitySprite = this.spriteMap.get(entity.id);

				[entitySprite.x, entitySprite.y] = utils.locationToCoordinates(entity.location, Constants.GRID_SIZE);
			} else {
				this.addEntity(entity, entity.location);
			}
		});

		keys.forEach((id) => {
			this.removeChild(this.spriteMap.get(id));
			this.spriteMap.delete(id);
		});
	}

	addEntity(entity: Game.Crawl.CondensedEntity, location: Game.Crawl.Location) {
		let entitySprite = this.getEntitySprite(entity.graphics);

		[entitySprite.x, entitySprite.y] = utils.locationToCoordinates(location, Constants.GRID_SIZE);

		this.addChild(entitySprite);
		this.spriteMap.set(entity.id, entitySprite);
	}

	getEntitySprite(entityGraphicsKey: string): EntitySprite {
		let entityGraphics = EntityLayer.entityGraphicsCache.get(entityGraphicsKey);
		return new EntitySprite(entityGraphics.base, entityGraphics.object);
	}

	moveEntity(entity: Game.Crawl.CondensedEntity, from: Game.Crawl.Location, to: Game.Crawl.Location): Thenable {
		if (!this.spriteMap.has(entity.id)) {
			this.addEntity(entity, from);
		}

		let entitySprite = this.spriteMap.get(entity.id);
		[entitySprite.x, entitySprite.y] = utils.locationToCoordinates(from, Constants.GRID_SIZE);

		let [xTarget, yTarget] = utils.locationToCoordinates(to, Constants.GRID_SIZE);

		let xPrm = this.tweenHandler.tween(entitySprite, "x", xTarget, Constants.WALK_SPEED);
		let yPrm = this.tweenHandler.tween(entitySprite, "y", yTarget, Constants.WALK_SPEED);

		return Promise.all([xPrm, yPrm]);
	}

	moveTo(location: Game.Crawl.Location): Thenable {
		let [xTarget, yTarget] = utils.locationToCoordinates(location, Constants.GRID_SIZE);

		let xPrm = this.tweenHandler.tween(this, "x", -xTarget, Constants.WALK_SPEED);
		let yPrm = this.tweenHandler.tween(this, "y", -yTarget, Constants.WALK_SPEED);

		return Promise.all([xPrm, yPrm]);
	}

	setEntityAnimation(entityId: string, animation: string, direction?: number) {
		this.spriteMap.get(entityId).setAnimation(animation);

		if (direction !== undefined) {
			this.spriteMap.get(entityId).direction = direction;
		}
	}

	setAnimationEndListener(entityId: string, f: () => any) {
		this.spriteMap.get(entityId).addAnimationEndListener(f);
	}

	clear(): void {
		this.removeChildren();
		this.spriteMap.clear();
	}

	prerender(): void {
		this.children.sort((a: EntitySprite, b: EntitySprite) => a.y - b.y);
	}

	renderCanvas(renderer: PIXI.CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	renderWebGL(renderer: PIXI.WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}
}