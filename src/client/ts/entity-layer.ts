"use strict";

import Constants                    from "./constants";
import EntitySprite                 from "./graphics/entity-sprite";
import * as GraphicsDescriptorCache from "./graphics/graphics-descriptor-cache";
import GraphicsObject               from "./graphics/graphics-object";
import Layer                        from "./graphics/layer";
import * as state                   from "./state";
import * as Markers                 from "./graphics/markers";
import * as Tweener                 from "./graphics/tweener";
import * as utils                   from "../../common/utils";

export default class EntityLayer extends Layer<string> {
	protected map: Map<string, EntitySprite>;

	protected generateGraphicsObject(key: string): GraphicsObject {
		let descriptor = GraphicsDescriptorCache.getEntityGraphics(key);
		let obj = new EntitySprite(descriptor);
		obj.z = 2;

		return obj;
	}

	public update() {
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

	public forceUpdate() {
		this.update();

		state.getState().entities.forEach((entity) => {
			Object.assign(this.map.get(entity.id), utils.locationToPoint(entity.location, Constants.GRID_SIZE));
		});
	}

	public setObjectDirection(id: string, direction: number) {
		if (!this.map.has(id)) {
			throw new Error(`No object with id ${id}.`);
		}
		this.map.get(id).direction = direction;
	}

	protected prerender(): void {
		this.children.sort((a, b) => a.y - b.y);
	}
}