"use strict";

import * as Constants    from "./constants";
import {GraphicsManager} from "./graphics/graphics-manager";
import {GraphicsObject}  from "./graphics/graphics-object";
import * as state        from "./state";
import * as utils        from "../../common/utils";

export class ItemManager extends GraphicsManager<GraphicsObjectDescriptor> {
	constructor() {
		super();
	}

	protected generateGraphicsObject(descriptor: GraphicsObjectDescriptor): GraphicsObject {
		return new GraphicsObject(descriptor);
	}

	update() {
		this.clear();

		for (let item of state.getState().items) {
			let {x, y} = utils.locationToPoint(item.location, Constants.GRID_SIZE);
			this.addObject(item.id, item.graphics, {x, y});
		}
	}
}