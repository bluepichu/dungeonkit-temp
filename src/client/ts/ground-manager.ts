"use strict";

import Constants       from "./constants";
import GraphicsManager from "./graphics/graphics-manager";
import GraphicsObject  from "./graphics/graphics-object";
import * as state      from "./state";
import * as utils      from "../../common/utils";

export default class GroundManager extends GraphicsManager<string, GraphicsObjectDescriptor> {
	private roomBounds: Map<number, Viewport>;

	constructor(container: PIXI.Container) {
		super(container);

		this.roomBounds = new Map();
	}

	protected generateGraphicsObject(descriptor: GraphicsObjectDescriptor): GraphicsObject {
		return new GraphicsObject(descriptor);
	}

	public update(location: CrawlLocation) {
		let roomId = utils.getTile(state.getState().floor.map, location).roomId;

		if (roomId > 0) {
			if (!this.roomBounds.has(roomId)) {
				this.roomBounds.set(roomId, { r: [location.r, location.r], c: [location.c, location.c] });
			}
			let roomBounds = this.roomBounds.get(roomId);
			roomBounds.r[0] = Math.min(roomBounds.r[0], location.r);
			roomBounds.r[1] = Math.max(roomBounds.r[1], location.r);
			roomBounds.c[0] = Math.min(roomBounds.c[0], location.c);
			roomBounds.c[1] = Math.max(roomBounds.c[1], location.c);
		}

		for (let i = location.r - 1; i <= location.r + 1; i++) {
			for (let j = location.c - 1; j <= location.c + 1; j++) {
				if (i < 0 || i >= state.getState().floor.map.height || j < 0 || j >= state.getState().floor.map.width) {
					continue;
				}

				let desc = this.getTileDescriptor(state.getState().floor.map, { r: i, c: j }, state.getState().dungeon.graphics);

				if (desc === undefined) {
					continue;
				}

				this.addObject(i + ", " + j, desc, utils.locationToPoint({ r: i, c: j }, Constants.GRID_SIZE));
			}
		}
	}

	private getTileDescriptor(
		map: FloorMap,
		loc: CrawlLocation,
		graphics: DungeonGraphicsDescriptor): GraphicsObjectDescriptor {
		let canPlace: boolean = true;

		utils.withinNSteps(1, loc, (location) =>
			canPlace = canPlace &&
				(!utils.isCrawlLocationInFloorMap(map, location)
				|| utils.getTile(map, location).type !== DungeonTileType.UNKNOWN));

		if (!canPlace) {
			return undefined;
		}

		if (utils.getTile(map, loc).stairs) {
			return graphics.stairs;
		}

		if (utils.getTile(map, loc).type === DungeonTileType.FLOOR) {
			return graphics.open;
		}

		let pattern = 0;

		for (let i = 0; i < 8; i++) {
			let [dr, dc] = utils.decodeDirection(i);

			pattern <<= 1;
			let [r, c] = [loc.r + dr, loc.c + dc];

			if (utils.getTile(map, { r, c }).type === DungeonTileType.WALL
				|| !utils.isCrawlLocationInFloorMap(map, { r, c })) {
				pattern |= 1;
			}
		}

		for (let i = 0; i < graphics.walls.length; i++) {
			if ((graphics.walls[i].pattern & pattern) === graphics.walls[i].pattern) {
				return graphics.walls[i].object;
			}
		}
	}

	public getRoomBounds(roomId: number): Viewport {
		return this.roomBounds.get(roomId);
	}

	public clear(): void {
		super.clear();
		this.roomBounds.clear();
	}
}