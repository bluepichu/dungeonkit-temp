"use strict";

import * as Constants      from "./constants";
import {EntitySprite}      from "./graphics/entity-sprite";
import {GraphicsObject}    from "./graphics/graphics-object";
import {Layer}             from "./graphics/layer";
import * as state          from "./state";
import * as Markers        from "./graphics/markers";
import * as Tweener        from "./graphics/tweener";
import * as utils          from "../../common/utils";

export class EntityLayer extends Layer<string> {
	public static entityGraphicsCache: EntityGraphicsCache = new Map();
	protected map: Map<string, EntitySprite>;

	constructor() {
		super();
	}

	protected generateGraphicsObject(entityGraphicsId: string): GraphicsObject {
		let descriptor = EntityLayer.entityGraphicsCache.get(entityGraphicsId);
		return new GraphicsObject(descriptor);
	}

	update() {
		let keys: Set<string> = new Set(this.map.keys());

		state.getState().entities.forEach((entity) => {
			keys.delete(entity.id);

			if (this.map.has(entity.id)) {
				let entitySprite = this.map.get(entity.id);

				let {x, y} = utils.locationToPoint(entity.location, Constants.GRID_SIZE);

				entitySprite.x = x;
				entitySprite.y = y;
			} else {
				this.addEntity(entity, entity.location);
			}

			let entitySprite = this.map.get(entity.id);
			entitySprite.clearStatusMarkers();

			if (entity.stats.attack.modifier < 0 || entity.stats.defense.modifier < 0) {
				// entitySprite.addStatusMarker(new GraphicsObject(Markers.STATUS_STAT_DOWN));
			}
		});

		keys.forEach((id) => {
			this.removeChild(this.map.get(id));
			this.map.delete(id);
		});
	}

	addEntity(entity: CondensedEntity, location: CrawlLocation) {
		let entitySprite = this.getEntitySprite(entity.graphics);

		let {x, y} = utils.locationToPoint(location, Constants.GRID_SIZE);

		entitySprite.x = x;
		entitySprite.y = y;

		this.addChild(entitySprite);
		this.map.set(entity.id, entitySprite);
	}

	getEntitySprite(entityGraphicsKey: string): EntitySprite {
		return new EntitySprite(EntityLayer.entityGraphicsCache.get(entityGraphicsKey));
	}

	moveEntity(entity: CondensedEntity, from: CrawlLocation, to: CrawlLocation): Thenable {
		if (!this.map.has(entity.id)) {
			this.addEntity(entity, from);
		}

		let {x, y} = utils.locationToPoint(to, Constants.GRID_SIZE);

		return this.moveObject(entity.id, { x, y }, Constants.WALK_SPEED);
	}

	public setObjectDirection(id: string, direction: number) {
		this.map.get(id).direction = direction;
	}
}