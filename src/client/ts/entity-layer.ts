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
		return new EntitySprite(descriptor);
	}

	update() {
		let keys: Set<string> = new Set(this.map.keys());

		state.getState().entities.forEach((entity) => {
			keys.delete(entity.id);

			let {x, y} = utils.locationToPoint(entity.location, Constants.GRID_SIZE);

			if (!this.map.has(entity.id)) {
				this.addObject(entity.id, entity.graphics, {x, y});
			} else {
				Object.assign(this.map.get(entity.id), {x, y});
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

	public setObjectDirection(id: string, direction: number) {
		this.map.get(id).direction = direction;
	}
}