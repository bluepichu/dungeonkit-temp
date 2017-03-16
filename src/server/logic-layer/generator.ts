"use strict";

import * as shortid     from "shortid";

import * as printer     from "./printer";
import * as utils       from "../../common/utils";

const log = require("beautiful-log")("dungeonkit:generator");

/*
 * Generates a new crawl state on the given floor of the given dungeon with the given entities.
 * @param dungeon - The dungeon.
 * @param floor - The floor number.
 * @param blueprint - The floor blueprint.
 * @param entities - A list of entites to place on the floor.  These entities are all treated as a single group and are
 *     placed near each other, regardless of alignment.
 * @return A new crawl state on the generated floor.
 */
export function generateFloor(
	dungeon: Dungeon,
	floor: number,
	blueprint: FloorBlueprint,
	entities: UnplacedCrawlEntity[]): InProgressCrawlState {
	let map = generateFloorMap(blueprint.generatorOptions);
	map = placeStairs(map);
	let state = initializeState(dungeon, floor, map);
	state = placeEntityGroup(state, entities);
	state = placeEnemies(state, blueprint);
	state = placeItems(state, blueprint);
	return state;
}

type MacroTile = RoomMacroTile | JunctionMacroTile;

interface RoomMacroTile {
	type: "room";
	connectors: {
		up: CrawlLocation,
		down: CrawlLocation,
		left: CrawlLocation,
		right: CrawlLocation
	}
}

interface JunctionMacroTile {
	type: "junction";
	connectors: {
		up: CrawlLocation,
		down: CrawlLocation,
		left: CrawlLocation,
		right: CrawlLocation
	}
}

/*
 * Generates a new map.
 * @param options - The generator parameters.
 * @return The generated map.
 */
function generateFloorMap(options: GeneratorOptions): FloorMap {
	let mw = evaluateDistribution(options.width);
	let mh = evaluateDistribution(options.height);
	let scale = options.scale;

	let macro: MacroTile[][] = Array.from(new Array(mh), () => Array.from(new Array(mw), () => undefined))
	let grid: DungeonTile[][] = Array.from(new Array(mh * scale), () => Array.from(new Array(mw * scale), () => ({ type: DungeonTileType.WALL })));

	let available: [number, number][] = [];

	for (let i = 0; i < mh; i++) {
		for (let j = 0; j < mw; j++) {
			available.push([i, j]);
		}
	}

	let rooms = evaluateDistribution(options.rooms);
	let junctions = evaluateDistribution(options.junctions);

	rooms = Math.max(rooms, 1);
	junctions = Math.min(junctions, mw*mh - rooms);

	for (let k = 0; k < rooms; k++) {
		let locidx = utils.randint(0, available.length - 1);
		let loc = available[locidx];
		available.splice(locidx, 1);

		let roomidx = utils.randint(0, options.features.rooms.length - 1);
		let roomFeature = options.features.rooms[roomidx];

		let dr = loc[0] * scale + utils.randint(2, scale - roomFeature.height - 2);
		let dc = loc[1] * scale + utils.randint(2, scale - roomFeature.width - 2);

		let possibleConnectors = {
			up: [] as CrawlLocation[],
			down: [] as CrawlLocation[],
			left: [] as CrawlLocation[],
			right: [] as CrawlLocation[]
		};

		for (let i = 0; i < roomFeature.height; i++) {
			for (let j = 0; j < roomFeature.width; j++) {
				switch (roomFeature.grid[i][j]) {
					case " ":
						grid[i + dr][j + dc] = { type: DungeonTileType.FLOOR, roomId: k + 1 };
						break;

					case "^":
						possibleConnectors.up.push({ r: i + dr, c: j + dc });
						break;

					case "v":
						possibleConnectors.down.push({ r: i + dr, c: j + dc });
						break;

					case "<":
						possibleConnectors.left.push({ r: i + dr, c: j + dc });
						break;

					case ">":
						possibleConnectors.right.push({ r: i + dr, c: j + dc });
						break;
				}
			}
		}

		macro[loc[0]][loc[1]] = {
			type: "room",
			connectors: {
				up: possibleConnectors.up[utils.randint(0, possibleConnectors.up.length - 1)],
				down: possibleConnectors.down[utils.randint(0, possibleConnectors.down.length - 1)],
				left: possibleConnectors.left[utils.randint(0, possibleConnectors.left.length - 1)],
				right: possibleConnectors.right[utils.randint(0, possibleConnectors.right.length - 1)]
			}
		};
	}

	for (let k = 0; k < junctions; k++) {
		let locidx = utils.randint(0, available.length - 1);
		let loc = available[locidx];
		available.splice(locidx, 1);

		let start = {
			r: loc[0] * scale + utils.randint(Math.floor(scale / 5), Math.floor(4 * scale / 5)),
			c: loc[1] * scale + utils.randint(Math.floor(scale / 5), Math.floor(2 * scale / 5))
		};

		let end = {
			r: start.r,
			c: start.c + 1
		}

		connect(grid, start, end);
		let leftUp = Math.random() < .5;

		macro[loc[0]][loc[1]] = {
			type: "junction",
			connectors: {
				left: start,
				right: end,
				up: leftUp ? start : end,
				down: leftUp ? end : start
			}
		};
	}

	for (let mi = 0; mi < mh; mi++) {
		for (let mj = 0; mj < mw; mj++) {
			if (macro[mi][mj]) {
				for (let mi2 = mi + 1; mi2 < mh; mi2++) {
					if (macro[mi2][mj]) {
						let start = macro[mi][mj].connectors.down;
						let end = macro[mi2][mj].connectors.up;
						grid[start.r][start.c] = { type: DungeonTileType.FLOOR };
						start.r++;
						grid[end.r][end.c] = { type: DungeonTileType.FLOOR };
						end.r--;
						connect(grid, start, end);
						break;
					}
				}
				for (let mj2 = mj + 1; mj2 < mh; mj2++) {
					if (macro[mi][mj2]) {
						let start = macro[mi][mj].connectors.right;
						let end = macro[mi][mj2].connectors.left;
						grid[start.r][start.c] = { type: DungeonTileType.FLOOR };
						start.c++;
						grid[end.r][end.c] = { type: DungeonTileType.FLOOR };
						end.c--;
						connect(grid, start, end);
						break;
					}
				}
			}
		}
	}

	return {
		width: mw * scale,
		height: mh * scale,
		grid
	}
}

/**
 * Makes a path to connect the two points.
 */
function connect(grid: DungeonTile[][], start: CrawlLocation, end: CrawlLocation) {
	let loc = { r: start.r, c: start.c };

	while (loc.r != end.r || loc.c != end.c) {
		grid[loc.r][loc.c] = { type: DungeonTileType.FLOOR };

		if (loc.c == end.c || (loc.r != end.r && Math.random() < .5)) {
			if (loc.r > end.r) {
				loc.r--;
			} else {
				loc.r++;
			}
		} else {
			if (loc.c > end.c) {
				loc.c--;
			} else {
				loc.c++;
			}
		}
	}

	grid[end.r][end.c] = { type: DungeonTileType.FLOOR };
}

/**
 * Initializes a state object.
 * @param dungeon - The dungeon.
 * @param floor - The floor number.
 * @param map - The map.
 * @return The state object.
 */
function initializeState(
	dungeon: Dungeon,
	floor: number,
	map: FloorMap): InProgressCrawlState {
	return {
		dungeon,
		floor: {
			map,
			number: floor
		},
		items: [],
		entities: []
	};
}

/**
 * Places a group of entities.  A random location is chosen in a room for the first entity, and other entities are
 *     placed within the same room spiraling out from the first entity.
 * @param state - The state.
 * @param entities - The entities to place.
 * @returns The state with the entities placed.
 */
function placeEntityGroup(state: InProgressCrawlState, entities: UnplacedCrawlEntity[]): InProgressCrawlState {
	let map: FloorMap = {
		width: state.floor.map.width,
		height: state.floor.map.height,
		grid: utils.tabulate((row) =>
			utils.tabulate((col) =>
				({ type: DungeonTileType.UNKNOWN }),
				state.floor.map.width),
			state.floor.map.height)
	};

	let location: CrawlLocation;

	do {
		location = {
			r: utils.randint(0, state.floor.map.height - 1),
			c: utils.randint(0, state.floor.map.width - 1)
		};
	} while (!(utils.isCrawlLocationInRoom(state.floor.map, location) && utils.isCrawlLocationEmpty(state, location)));

	let loc = { r: location.r, c: location.c };
	for (let i = 0; i < Math.max(state.floor.map.width, state.floor.map.height); i++) {
		for (let [dr, dc, di] of [[-1, 0, 0], [0, 1, 0], [1, 0, 1], [0, -1, 1]]) {
			for (let j = 0; j < 2 * i + di; j++) {
				if (utils.getTile(state.floor.map, loc).type === DungeonTileType.FLOOR
					&& utils.inSameRoom(state.floor.map, location, loc)
					&& utils.isCrawlLocationEmpty(state, loc)) {
					state.entities.push(Object.assign(wrap(entities.pop()), { location: { r: loc.r, c: loc.c }, map }));
					if (entities.length === 0) {
						return state;
					}
				}
				loc.r += dr;
				loc.c += dc;
			}
		}
	}

	// We need to do something with the remaining entities... let's try again.
	return placeEntityGroup(state, entities);
}

/**
 * Places the enemies for a floor.
 * @param state - The state.
 * @param blueprint - The floor blueprint.
 * @return The state with the entities placed.
 */
function placeEnemies(
	state: InProgressCrawlState,
	blueprint: FloorBlueprint): InProgressCrawlState {
	blueprint.enemies.forEach((enemyBlueprint) => {
		let count = evaluateDistribution(enemyBlueprint.density);

		for (let i = 0; i < count; i++) {
			placeEntityGroup(state, [wrap({
				name: enemyBlueprint.name,
				graphics: enemyBlueprint.graphics,
				id: shortid.generate(),
				attacks: enemyBlueprint.attacks
					.sort((a, b) => Math.random() * b.weight - Math.random() * a.weight)
					.slice(0, 4)
					.map((attackBlueprint) => attackBlueprint.attack),
				stats: {
					level: enemyBlueprint.stats.level,
					attack: { base: enemyBlueprint.stats.attack.base, modifier: 0 },
					defense: { base: enemyBlueprint.stats.defense.base, modifier: 0 },
					hp: { max: enemyBlueprint.stats.hp.max, current: enemyBlueprint.stats.hp.current },
					belly: { max: enemyBlueprint.stats.belly.max, current: enemyBlueprint.stats.belly.current }
				},
				alignment: 0,
				ai: true,
				items: {
					held: { capacity: 1, items: [] }
				},
			})]);
		}
	});

	return state;
}

/**
 * Places the items for a floor.
 * @param state - The state.
 * @param blueprint - The floor blueprint.
 * @return The state with the items placed.
 */
function placeItems(
	state: InProgressCrawlState,
	blueprint: FloorBlueprint): InProgressCrawlState {
	blueprint.items.forEach((itemBlueprint) => {
		let count = evaluateDistribution(itemBlueprint.density);

		for (let i = 0; i < count; i++) {
			let location: CrawlLocation;

			do {
				location = {
					r: utils.randint(0, state.floor.map.height),
					c: utils.randint(0, state.floor.map.width)
				};
			} while (!utils.isCrawlLocationInRoom(state.floor.map, location)
				|| utils.getItemAtCrawlLocation(state, location) !== undefined);

			let item: CrawlItem = Object.assign({ id: shortid.generate(), location }, itemBlueprint.item);
			state.items.push(item);
		}
	});

	return state;
}

/**
 * Selects a feature to place in the map.
 * @param features - The list of features that can be placed.  Must be nonempty.
 * @return The feature selected for placement.
 */
function selectFeature(features: Feature[]): Feature {
	let sum = features.map((feature) => feature.weight).reduce((a, b) => a + b, 0);
	let v = Math.random() * sum;

	for (let i = 0; i < features.length; i++) {
		v -= features[i].weight;

		if (v <= 0) {
			return features[i];
		}
	}

	return features[features.length - 1];
}

/**
 * Checks if a given feature can be placed in the grid at the given location.
 * @param grid - The current grid.
 * @param location - The location to place the feature.
 * @param feature - The feature to place.
 * @param isRoom - Whether or not the feature is a room.
 * @return Whether or not the feature can be placed in that location.
 */
function canPlaceFeature(
	grid: number[][],
	location: CrawlLocation,
	feature: Feature,
	isRoom: boolean): boolean {
	let matched: boolean = false;
	let { r, c } = location;

	if (r < 0 || r + feature.height >= grid.length || c < 0 || c + feature.width >= grid[0].length) {
		return false;
	}

	for (let i = 0; i < feature.height; i++) {
		for (let j = 0; j < feature.width; j++) {
			if (grid[r + i][c + j] === 0) {
				continue;
			}

			switch (feature.grid[i][j]) {
				case "#":
					if (grid[r + i][c + j] === 9 || grid[r + i][c + j] < 0) {
						return false;
					}
					break;

				case ">":
					if (isRoom && grid[r + i][c + j] !== 7) {
						return false;
					}

					if (!isRoom && grid[r + i][c + j] !== 3 && grid[r + i][c + j] !== 7) {
						return false;
					}

					if (grid[r + i][c + j] === 3 || grid[r + i][c + j] === 7) {
						matched = true;
					}
					break;

				case "^":
					if (isRoom && grid[r + i][c + j] !== 8) {
						return false;
					}

					if (!isRoom && grid[r + i][c + j] !== 4 && grid[r + i][c + j] !== 8) {
						return false;
					}

					if (grid[r + i][c + j] === 4 || grid[r + i][c + j] === 8) {
						matched = true;
					}
					break;

				case "<":
					if (isRoom && grid[r + i][c + j] !== 5) {
						return false;
					}

					if (!isRoom && grid[r + i][c + j] !== 1 && grid[r + i][c + j] !== 5) {
						return false;
					}

					if (grid[r + i][c + j] === 1 || grid[r + i][c + j] === 5) {
						matched = true;
					}
					break;

				case "v":
					if (isRoom && grid[r + i][c + j] !== 6) {
						return false;
					}

					if (!isRoom && grid[r + i][c + j] !== 2 && grid[r + i][c + j] !== 6) {
						return false;
					}

					if (grid[r + i][c + j] === 2 || grid[r + i][c + j] === 6) {
						matched = true;
					}
					break;

				case " ":
					return false;
			}
		}
	}

	return matched;
}

/**
 * Places a feature in the grid.
 * @param grid - The current grid.
 * @param location - The location to place the feature.
 * @param feature - The feature to place.
 * @param roomId - The room ID of the feature being placed.
 * @return An array of locations at which future features can be placed.
 */
function placeFeature(
	grid: number[][],
	location: CrawlLocation,
	feature: Feature,
	roomId: number): CrawlLocation[] {
	let { r, c } = location;
	let choices: CrawlLocation[] = [];

	for (let i = 0; i < feature.height; i++) {
		for (let j = 0; j < feature.width; j++) {
			switch (feature.grid[i][j]) {
				case "#":
					grid[r + i][j + c] = 10;
					break;

				case ">":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 1 : 5;
						choices.push({r: r + i, c: j + c});
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case "^":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 2 : 6;
						choices.push({r: r + i, c: j + c});
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case "<":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 3 : 7;
						choices.push({r: r + i, c: j + c});
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case "v":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 4 : 8;
						choices.push({r: r + i, c: j + c});
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case " ":
					if (roomId === 0) {
						grid[r + i][j + c] = 9;
					} else {
						grid[r + i][j + c] = -roomId - 1;
					}
					break;
			}
		}
	}

	return choices;
}

/**
 * Converts a number grid to a map.
 * @param grid - The grid of numbers to convert.
 * @return The map.
 */
function gridToFloorMap(grid: number[][]): FloorMap {
	return {
		width: grid[0].length,
		height: grid.length,
		grid: grid.map((row) => row.map(numberToTile))
	};
}

/**
 * Converts a number to a tile.
 * @param val - The number to convert.
 * @return The corresponding dungeon tile.
 */
function numberToTile(val: number): DungeonTile {
	switch (val) {
		case 0:
			return { type: DungeonTileType.WALL };
		case 10:
			return { type: DungeonTileType.WALL };
		case 9:
			return { type: DungeonTileType.FLOOR };
		default:
			if (val > 0) {
				return { type: DungeonTileType.WALL };
			} else {
				return { type: DungeonTileType.FLOOR, roomId: -(val + 1) };
			}
	}
}

/**
 * Places the stairs on a map.
 * @param map - The map on which to place the stairs.
 * @return The map with the stairs.
 */
function placeStairs(map: FloorMap): FloorMap {
	let loc: CrawlLocation;

	do {
		loc = {
			r: utils.randint(0, map.height - 1),
			c: utils.randint(0, map.width - 1)
		};
	} while (!(utils.isCrawlLocationInRoom(map, loc)));

	map.grid[loc.r][loc.c].stairs = true;
	return map;
}

/**
 * Selects a value from a distribution.
 * @param distribution - The distribution.
 * @return The selected value.
 */
function evaluateDistribution(distribution: Distribution): number {
	switch (distribution.type) {
		case "binomial":
			let v = 0;

			for (let i = 0; i < distribution.n; i++) {
				v += Math.random() < distribution.p ? 1 : 0;
			}

			return v;

		case "uniform":
			return utils.randint(distribution.a, distribution.b);

		// default:
		// 	throw new Error(`[Error X] Unknown probability distribution type "${distribution.type}".`);
	}
}

interface WrappedUnplacedCrawlEntity extends UnplacedCrawlEntity {
	wrapped: boolean;
}

/**
 * Wraps an entity in a proxy to handle equipped items.
 * @param entity - The entity to wrap.
 * @return The wrapped entity.
 */
export function wrap(entity: UnplacedCrawlEntity): WrappedUnplacedCrawlEntity {
	if (isWrapped(entity)) {
		// Don't double-wrap the entity
		return entity;
	}

	return new Proxy(entity, {
		get(target: UnplacedCrawlEntity, field: string | number | symbol): any {
			let base = entity;

			if (field === "wrapped") {
				return true;
			}

			for (let item of entity.items.held.items) {
				if (item.equip !== undefined) {
					base = item.equip(base);
				}
			}

			return (base as any)[field];
		}
	}) as WrappedUnplacedCrawlEntity;
}

/**
 * Determines if the input is a wrapped.
 * @param entity - The entity to check.
 * @return Whether or not the entity is wrapped.
 */
function isWrapped(entity: UnplacedCrawlEntity): entity is WrappedUnplacedCrawlEntity {
	return "wrapped" in entity;
}