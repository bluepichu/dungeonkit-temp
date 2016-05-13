"use strict";

import * as executer        from "./executer";
import * as generator       from "./generator";
import * as utils           from "./utils";

import * as log             from "beautiful-log";
import {sprintf as sprintf} from "sprintf-js";

export function startCrawl(dungeon: Game.Crawl.Dungeon,
                           entities: Game.Crawl.UnplacedCrawlEntity[]): Promise<Game.Crawl.ConcludedCrawlState> {
	if (validateDungeonBlueprint(dungeon)) {
		let state = advanceToFloor(dungeon, 1, entities);

		if (utils.isCrawlOver(state)) {
			return Promise.resolve(state);
		} else {
			return new Promise((done, _) => {
				step(state as Game.Crawl.InProgressCrawlState, done);
			});
		}
	} else {
		throw new Error(sprintf("[Code 1] Dungeon blueprint for dungeon '%s' failed validation.", dungeon.name));
	}
}

function step(state: Game.Crawl.InProgressCrawlState, done: (state: Game.Crawl.ConcludedCrawlState) => void): void {
	let entity = nextEntity(state);

	entity.controller.updateState(getCensoredState(state, entity));

	entity.controller.getAction(state, entity)
		.then((action: Game.Crawl.Action) => {
			let newState = executer.execute(state, entity, action);

			if (utils.isCrawlOver(newState)) {
				done(newState);
			} else {
				step(newState, done);
			}
		})
		.catch((err) => {
			log.error(err.stack);
		});
}

function nextEntity(state: Game.Crawl.InProgressCrawlState): Game.Crawl.CrawlEntity {
	let next = state.entities.shift();
	state.entities.push(next);
	return next;
}

function validateDungeonBlueprint(dungeon: Game.Crawl.Dungeon): boolean {
	if (dungeon.blueprint.length === 0) {
		return false;
	}

	let nextFloor = 1;

	for (let i = 0; i < dungeon.blueprint.length; i++) {
		if (dungeon.blueprint[i].range[0] !== nextFloor) {
			return false;
		}

		nextFloor = dungeon.blueprint[i].range[1] + 1;

		// TODO: more checks here
	}

	if (nextFloor !== dungeon.floors + 1) {
		return false;
	}

	return true;
}

export function advanceToFloor(dungeon: Game.Crawl.Dungeon,
                               floor: number,
                               entities: Game.Crawl.UnplacedCrawlEntity[]): Game.Crawl.CrawlState {
	if (floor > dungeon.blueprint[dungeon.blueprint.length - 1].range[1]) {
		return {
			dungeon: dungeon,
			success: true,
			floor: floor
		};
	} else {
		let blueprint = getFloorBlueprint(dungeon, floor);
		let options = blueprint.generatorOptions.options as Game.Crawl.FeatureGeneratorOptions;
		let floorplan = generator.generateFloor(options);

		let state: Game.Crawl.InProgressCrawlState = {
			dungeon: dungeon,
			floor: {
				number: floor,
				map: floorplan,
				items: []
			},
			entities: []
		};

		placeEntities(state, ...entities);

		placeStairs(state);

		// TODO...

		state.entities.forEach((entity) => entity.controller.updateState(getCensoredState(state, entity)));

		return state;
	}
}

function placeStairs(state: Game.Crawl.InProgressCrawlState): void {
	let loc: Game.Crawl.Location = {
		r: utils.randint(0, state.floor.map.height - 1),
		c: utils.randint(0, state.floor.map.width - 1)
	};

	while (!(utils.isLocationInRoom(state, loc))) {
		loc = {
			r: utils.randint(0, state.floor.map.height - 1),
			c: utils.randint(0, state.floor.map.width - 1)
		};
	}

	state.floor.map.grid[loc.r][loc.c].stairs = true;
}

function placeEntities(state: Game.Crawl.InProgressCrawlState, ...entities: Game.Crawl.UnplacedCrawlEntity[]): void {
	let map = {
		width: state.floor.map.width,
		height: state.floor.map.height,
		grid: utils.tabulate((row) =>
				utils.tabulate((col) =>
					({ type: "unknown" as "unknown", roomId: 0, stairs: false }),
					state.floor.map.width), state.floor.map.height)
	};

	let loc: Game.Crawl.Location = {
		r: utils.randint(0, state.floor.map.height - 1),
		c: utils.randint(0, state.floor.map.width - 1)
	};

	while (!(utils.isLocationInRoom(state, loc) && utils.isLocationEmpty(state, loc))) {
		loc = {
			r: utils.randint(0, state.floor.map.height - 1),
			c: utils.randint(0, state.floor.map.width - 1)
		};
	}

	let entity = createPlacedEntity(entities[0], loc, map);
	state.entities.push(entity);
	executer.updateMap(state, entity);

	let dr = 0;
	let dc = 0;
	let k = 1;
	let i = 1;

	if (i >= entities.length) {
		return;
	}

	while (true) {
		for (let j = 0; j < k; j++) {
			if (k % 2 === 1) {
				dr--;
			} else {
				dr++;
			}

			if (utils.isLocationInRoom(state, { r: loc.r + dr, c: loc.c + dc })
				&& utils.isLocationEmpty(state, { r : loc.r + dr, c : loc.c + dc })) {
				let entity = createPlacedEntity(entities[i], { r: loc.r + dr, c: loc.c + dc }, map);
				state.entities.push(entity);
				executer.updateMap(state, entity);

				i++;

				if (i >= entities.length) {
					return;
				}
			}
		}

		for (let j = 0; j < k; j++) {
			if (k % 2 === 1) {
				dc++;
			} else {
				dc--;
			}

			if (utils.isLocationInRoom(state, { r: loc.r + dr, c: loc.c + dc })
				&& utils.isLocationEmpty(state, { r: loc.r + dr, c: loc.c + dc })) {
				let entity = createPlacedEntity(entities[i], { r: loc.r + dr, c: loc.c + dc }, map);
				state.entities.push(entity);
				executer.updateMap(state, entity);

				if (i >= entities.length) {
					return;
				}
			}
		}
	}
}

function createPlacedEntity(unplacedEntity: Game.Crawl.UnplacedCrawlEntity,
	                        location: Game.Crawl.Location,
	                        map: Game.Crawl.Map): Game.Crawl.CrawlEntity {
	return {
		id: unplacedEntity.id,
		name: unplacedEntity.name,
		graphics: unplacedEntity.graphics,
		stats: unplacedEntity.stats,
		attacks: unplacedEntity.attacks,
		alignment: unplacedEntity.alignment,
		controller: unplacedEntity.controller,
		bag: unplacedEntity.bag,
		advances: unplacedEntity.advances,
		location: location,
		map: map
	};
}

function getFloorBlueprint(dungeon: Game.Crawl.Dungeon, floor: number): Game.Crawl.FloorBlueprint {
	if (floor < 0 || floor > dungeon.floors) {
		throw new RangeError(sprintf("[Code 2] Floor %d is out of range for dungeon '%s'.", floor, dungeon.name));
	}

	let lo = 0;
	let hi = dungeon.blueprint.length;

	while (lo < hi) {
		let mid = Math.floor((lo + hi) / 2);
		let bp = dungeon.blueprint[mid];

		if (floor < bp.range[0]) {
			hi = mid;
		} else if (floor > bp.range[1]) {
			lo = mid + 1;
		} else {
			return bp.blueprint;
		}
	}

	throw new RangeError(sprintf("[Code 3] A blueprint for floor %d was not found in the blueprint for dungeon '%s'.",
		dungeon.name));
}

function getCensoredState(state: Game.Crawl.InProgressCrawlState,
                          entity: Game.Crawl.CrawlEntity): Game.Crawl.CensoredEntityCrawlState {
	return {
		self: censorSelf(entity),
		dungeon: {
			name: state.dungeon.name,
			floors: state.dungeon.floors,
			direction: state.dungeon.direction,
			difficulty: state.dungeon.difficulty
		},
		floor: {
			number: state.floor.number,
			map: entity.map,
			items: state.floor.items.filter((item: Game.Crawl.CrawlItem) =>
				utils.visible(state, entity.location, item.location))
		},
		entities: state.entities.filter((ent: Game.Crawl.CrawlEntity) =>
			utils.visible(state, entity.location, ent.location)
			|| entity.alignment !== 0
			&& entity.alignment === ent.alignment).map(censorEntity)
	};
}

function censorEntity(entity: Game.Crawl.CrawlEntity): Game.Crawl.CensoredCrawlEntity {
	return {
		id: entity.id, 
		name: entity.name,
		location: entity.location,
		graphics: entity.graphics,
		alignment: entity.alignment,
		advances: entity.advances
	};
}

function censorSelf(entity: Game.Crawl.CrawlEntity): Game.Crawl.CensoredSelfCrawlEntity {
	return {
		id: entity.id,
		name: entity.name,
		location: entity.location,
		graphics: entity.graphics,
		alignment: entity.alignment,
		advances: entity.advances,
		map: entity.map,
		bag: entity.bag
	};
}