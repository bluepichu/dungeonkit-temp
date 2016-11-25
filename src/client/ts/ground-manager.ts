"use strict";

import {
	Container
} from "pixi.js";

import Constants                    from "./constants";
import * as GraphicsDescriptorCache from "./graphics/graphics-descriptor-cache";
import GraphicsManager              from "./graphics/graphics-manager";
import GraphicsObject               from "./graphics/graphics-object";
import * as state                   from "./state";
import * as utils                   from "../../common/utils";

export default class GroundManager extends GraphicsManager<string> {
	private roomBounds: Map<number, Viewport>;
	private _descriptor: ExpandedGraphicsObjectDescriptor;

	constructor(container: Container, descriptor: string) {
		super(container);

		this.roomBounds = new Map();
		this._descriptor = GraphicsDescriptorCache.getGraphics(descriptor);
	}

	public set descriptor(descriptor: string) {
		this._descriptor = GraphicsDescriptorCache.getGraphics(descriptor);
	}

	protected generateGraphicsObject(key: string): GraphicsObject {
		let tile = new GraphicsObject(this._descriptor);
		tile.setAnimation(key);
		return tile;
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

				let tileType = this.getTileType(state.getState().floor.map, { r: i, c: j });

				if (tileType !== undefined) {
					let obj = this.addObject(
						`${i}, ${j}`,
						tileType,
						utils.locationToPoint({ r: i, c: j }, Constants.GRID_SIZE));
				}
			}
		}
	}

	private getTileType(map: FloorMap, loc: CrawlLocation): string {
		let canPlace: boolean = true;

		utils.withinNSteps(1, loc, (location) =>
			canPlace = canPlace &&
				(!utils.isCrawlLocationInFloorMap(map, location)
				|| utils.getTile(map, location).type !== DungeonTileType.UNKNOWN));

		if (!canPlace) {
			return undefined;
		}

		if (utils.getTile(map, loc).stairs) {
			return "stairs";
		}

		if (utils.getTile(map, loc).type === DungeonTileType.FLOOR) {
			return "default";
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

		return "wall-" + ("00" + pattern.toString(16)).substr(-2);
	}

	public getRoomBounds(roomId: number): Viewport {
		return this.roomBounds.get(roomId);
	}

	public clear(): void {
		super.clear();
		this.roomBounds.clear();
	}
}