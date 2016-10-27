"use strict";

import Constants       from "./constants";
import GraphicsManager from "./graphics/graphics-manager";
import GraphicsObject  from "./graphics/graphics-object";
import * as state      from "./state";
import * as utils      from "../../common/utils";

export default class ItemManager extends GraphicsManager<string, GraphicsObjectDescriptor> {
	protected generateGraphicsObject(descriptor: GraphicsObjectDescriptor): GraphicsObject {
		let obj = new GraphicsObject(descriptor);
		obj.z = 1;
		return obj;
	}

	update() {
		this.clear();

		for (let item of state.getState().items) {
			let {x, y} = utils.locationToPoint(item.location, Constants.GRID_SIZE);
			this.addObject(item.id, item.graphics, {x, y});
		}
	}
}