"use strict";

import * as Constants    from "./constants";
import {EntitySprite}    from "./graphics/entity-sprite";
import {GraphicsObject}  from "./graphics/graphics-object";
import {GraphicsManager} from "./graphics/graphics-manager";
import * as state        from "./state";
import * as Markers      from "./graphics/markers";
import * as Tweener      from "./graphics/tweener";
import * as utils        from "../../common/utils";

export class EntityManager extends GraphicsManager<string, string> {
	public static entityGraphicsCache: EntityGraphicsCache = new Map();
	protected map: Map<string, EntitySprite>;

	protected generateGraphicsObject(entityGraphicsId: string): GraphicsObject {
		let descriptor = EntityManager.entityGraphicsCache.get(entityGraphicsId);
		let obj = new EntitySprite(descriptor);
		obj.z = 2;

		return obj;
	}

	update() {
		let current = new Set(this.map.keys());
		let visible = new Set(state.getState().entities.map((entity) => entity.id));
		let toAdd = new Set([...visible].filter((id) => !current.has(id)));
		let toRemove = new Set([...current].filter((id) => !visible.has(id)));

		toAdd.forEach((id) => {
			let entity = state.getState().entities.filter((entity) => entity.id === id)[0];
			this.addObject(id, entity.graphics, utils.locationToPoint(entity.location, Constants.GRID_SIZE));
		});

		toRemove.forEach((id) => {
			this.removeObject(id);
		});
	}

	public setObjectDirection(id: string, direction: number) {
		this.map.get(id).direction = direction;
	}
}