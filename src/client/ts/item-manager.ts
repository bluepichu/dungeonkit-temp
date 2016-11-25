"use strict";

import Constants                    from "./constants";
import * as GraphicsDescriptorCache from "./graphics/graphics-descriptor-cache";
import GraphicsManager              from "./graphics/graphics-manager";
import GraphicsObject               from "./graphics/graphics-object";
import * as state                   from "./state";
import * as utils                   from "../../common/utils";

export default class ItemManager extends GraphicsManager<string> {
	public update() {
		this.clear();

		for (let item of state.getState().items) {
			let {x, y} = utils.locationToPoint(item.location, Constants.GRID_SIZE);
			this.addObject(item.id, item.graphics, {x, y});
		}
	}

	protected generateGraphicsObject(key: string): GraphicsObject {
		let obj = new GraphicsObject(GraphicsDescriptorCache.getGraphics(key));
		obj.z = 1;
		return obj;
	}
}