"use strict";

import * as generator       from "./generator";
import * as printer         from "./printer";
import * as utils           from "../../common/utils";

import * as clone           from "clone";
import * as log             from "beautiful-log";
import {sprintf}            from "sprintf-js";

export function startCrawl(dungeon: Crawl.Dungeon,
	entities: Crawl.UnplacedCrawlEntity[]): Promise<Crawl.ConcludedCrawlState> {
	if (validateDungeonBlueprint(dungeon)) {
		return advanceToFloor(dungeon, 1, entities.map(wrap))
			.then((state) => {
				if (utils.isCrawlOver(state)) {
					return Promise.resolve(state);
				} else {
					return step(state as Crawl.InProgressCrawlState);
				}
			});
	} else {
		throw new Error(sprintf("[Code 1] Dungeon blueprint for dungeon '%s' failed validation.", dungeon.name));
	}
}

export function wrap(entity: Crawl.UnplacedCrawlEntity): Crawl.UnplacedCrawlEntity {
	return new Proxy(entity, {
		get(target: Crawl.UnplacedCrawlEntity, field: string | number | symbol): any {
			let base = entity;

			for (let item of entity.items.held.items) {
				if (item.equip !== undefined) {
					base = item.equip(base);
				}
			}

			return (base as any)[field];
		}
	});
}

function step(state: Crawl.InProgressCrawlState): Promise<Crawl.ConcludedCrawlState> {
	let entity = nextEntity(state);
	let censoredState = getCensoredState(state, entity);

	if (entity.controller.await) {
		state.entities.forEach((ent) => {
			if (ent !== entity) {
				ent.controller.wait();
			}
		});
	}

	return entity.controller.getAction(censoredState, entity)
		.then((action: Crawl.Action) => {
			return execute(state, entity, action)
				.then((newState) => {
					if (!state.entities.some((entity) => entity.advances)) {
						return Promise.resolve({
							dungeon: state.dungeon,
							success: false,
							floor: state.floor.number
						});
					}

					if (utils.isCrawlOver(newState)) {
						return Promise.resolve(newState);
					} else {
						return step(newState);
					}
				});
		})
		.catch((err: Error) => {
			log.error(err.stack);
		});
}

function checkItems(
	hook: ItemHook,
	entity: Crawl.CrawlEntity,
	state: Crawl.InProgressCrawlState,
	condition: () => boolean): void {
	if (entity.items.bag !== undefined) {
		for (let item of entity.items.bag.items) {
			if (!condition()) {
				return;
			}
			if (hook in item.handlers) {
				item.handlers[hook](entity, state, item, false);
			}
		}
	}

	for (let item of entity.items.held.items) {
		if (!condition()) {
			return;
		}
		if (hook in item.handlers) {
			item.handlers[hook](entity, state, item, true);
		}
	}
}

function nextEntity(state: Crawl.InProgressCrawlState): Crawl.CrawlEntity {
	let next = state.entities.shift();
	state.entities.push(next);
	return next;
}

function validateDungeonBlueprint(dungeon: Crawl.Dungeon): boolean {
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

function advanceToFloor(dungeon: Crawl.Dungeon,
	floor: number,
	entities: Crawl.UnplacedCrawlEntity[]): Promise<Crawl.CrawlState> {
	if (floor > dungeon.blueprint[dungeon.blueprint.length - 1].range[1]) {
		return Promise.resolve({
			dungeon: dungeon,
			success: true,
			floor: floor
		});
	} else {
		let blueprint = getFloorBlueprint(dungeon, floor);
		return generator.generateFloor(dungeon, floor, blueprint, entities)
			.then((state) => {
				state.entities.forEach((entity) => {
					updateMap(state, entity);

					entity.controller.pushEvent({
						type: "start",
						entity: {
							name: entity.name,
							graphics: entity.graphics,
							id: entity.id
						},
						floorInformation: {
							number: floor,
							width: state.floor.map.width,
							height: state.floor.map.height
						},
						self: censorSelf(entity)
					});

					entity.controller.updateState(getCensoredState(state, entity));
				});

				return state;
			});
	}
}

function createPlacedEntity(unplacedEntity: Crawl.UnplacedCrawlEntity,
	location: Crawl.Location,
	map: Crawl.Map): Crawl.CrawlEntity {
	let ret = unplacedEntity as Crawl.CrawlEntity;
	ret.location = location;
	ret.map = map;
	return ret;
}

function getFloorBlueprint(dungeon: Crawl.Dungeon, floor: number): Crawl.FloorBlueprint {
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

function getCensoredState(state: Crawl.InProgressCrawlState,
	entity: Crawl.CrawlEntity): Crawl.CensoredEntityCrawlState {
	function makeReadOnly<T>(obj: T, logstr: string = "[base]"): T {
		return new Proxy(obj, {
			get(target: T, field: string | number | symbol): any {
				if (typeof (target as any)[field] === "object") {
					return makeReadOnly((target as any)[field], logstr + "." + field.toString());
				}
				return (target as any)[field];
			},
			set(target: T, field: string | number | symbol, value: any): boolean {
				throw new TypeError(`Attempted illegal set action on field "${field}" of read-only object.`);
			}
		});
	}

	return makeReadOnly({
		self: censorSelf(entity),
		dungeon: {
			name: state.dungeon.name,
			floors: state.dungeon.floors,
			direction: state.dungeon.direction,
			difficulty: state.dungeon.difficulty,
			graphics: state.dungeon.graphics
		},
		floor: {
			number: state.floor.number,
			map: entity.map
		},
		entities: state.entities.filter((ent: Crawl.CrawlEntity) =>
			utils.isVisible(state.floor.map, entity.location, ent.location)).map((ent) =>
				ent.alignment === entity.alignment ? censorSelf(ent) : censorEntity(ent)),
		items: state.items.filter((item: Crawl.CrawlItem) =>
			utils.isVisible(state.floor.map, entity.location, item.location))
	});
}

function censorEntity(entity: Crawl.CrawlEntity): Crawl.CensoredCrawlEntity {
	return {
		id: entity.id,
		name: entity.name,
		location: entity.location,
		graphics: entity.graphics,
		alignment: entity.alignment,
		advances: entity.advances,
		stats: {
			attack: { modifier: entity.stats.attack.modifier },
			defense: { modifier: entity.stats.defense.modifier }
		}
	};
}

function censorSelf(entity: Crawl.CrawlEntity): Crawl.CensoredSelfCrawlEntity {
	return {
		id: entity.id,
		name: entity.name,
		stats: entity.stats,
		attacks: entity.attacks,
		location: entity.location,
		graphics: entity.graphics,
		alignment: entity.alignment,
		advances: entity.advances,
		map: entity.map,
		items: entity.items
	};
}

export function isValidAction(state: Crawl.CensoredInProgressCrawlState,
	entity: Crawl.CrawlEntity,
	action: Crawl.Action): boolean {
	switch (action.type) {
		case "wait":
			return true;

		case "move":
			return isValidMove(state, entity, (action as Crawl.MoveAction).direction);

		case "attack":
			return true;

		case "item":
			return true; // TODO

		case "stairs":
			return state.floor.map.grid[entity.location.r][entity.location.c].stairs;
	}
}

function execute(state: Crawl.InProgressCrawlState,
	entity: Crawl.CrawlEntity,
	action: Crawl.Action): Promise<Crawl.CrawlState> {
	let result: Promise<Crawl.CrawlState> = undefined;

	switch (action.type) {
		case "move":
			result = executeMove(state, entity, action as Crawl.MoveAction);
			break;

		case "attack":
			result = executeAttack(state, entity, action as Crawl.AttackAction);
			break;

		case "item":
			result = executeItem(state, entity, action as Crawl.ItemAction);
			break;

		case "stairs":
			result = executeStairs(state, entity, action as Crawl.StairsAction);
			break;

		default:
			result = Promise.resolve(state);
			break;
	}

	return result.then((newState) => postExecute(newState, entity));
}

function postExecute(state: Crawl.CrawlState,
	entity: Crawl.CrawlEntity): Crawl.CrawlState {
	if (utils.isCrawlOver(state)) {
		return state;
	}

	let newState = state as Crawl.InProgressCrawlState;

	newState.entities.filter((entity) => entity.stats.hp.current <= 0)
		.forEach((entity) =>
			checkItems(ItemHook.ENTITY_DEFEAT, entity, newState, () => entity.stats.hp.current <= 0));

	newState.entities.filter((entity) => entity.stats.hp.current <= 0)
		.forEach((entity) => propagateLogEvent(newState, {
			type: "defeat",
			entity: {
				id: entity.id,
				name: entity.name,
				graphics: entity.graphics
			},
			location: entity.location
		}));

	newState.entities = newState.entities.filter((entity) => entity.stats.hp.current > 0);
	newState.entities.forEach((entity) => updateMap(newState, entity));

	entity.controller.updateState(getCensoredState(newState, entity));

	return newState;
}

function executeMove(state: Crawl.InProgressCrawlState,
	entity: Crawl.CrawlEntity,
	action: Crawl.MoveAction): Promise<Crawl.CrawlState> {
	let start = entity.location;

	if (!isValidMove(state, entity, action.direction)) {
		return Promise.resolve(state);
	}

	let offset: [number, number] = utils.decodeDirection(action.direction);
	let location = { r: entity.location.r + offset[0], c: entity.location.c + offset[1] };

	entity.location = location;

	propagateLogEvent(state, {
		type: "move",
		entity: {
			id: entity.id,
			name: entity.name,
			graphics: entity.graphics
		},
		start: start,
		end: entity.location,
		direction: action.direction
	});

	return executeItemPickup(state, entity);
}

function executeItemPickup(state: Crawl.InProgressCrawlState,
	entity: Crawl.CrawlEntity): Promise<Crawl.CrawlState> {
	let item = utils.getItemAtLocation(state, entity.location);

	if (item !== undefined) {
		if (entity.items.bag !== undefined && entity.items.bag.items.length < entity.items.bag.capacity) {
			entity.items.bag.items.push(item);
			state.items = state.items.filter((it) => it !== item);
		} else if (entity.items.held.items.length < entity.items.held.capacity) {
			entity.items.held.items.push(item);
			state.items = state.items.filter((it) => it !== item);
		} else {
			return Promise.resolve(state);
		}

		propagateLogEvent(state, {
			type: "item_pickup",
			entity: {
				id: entity.id,
				name: entity.name,
				graphics: entity.graphics
			},
			item: item
		});
	}

	return Promise.resolve(state);
}

function executeItemDrop(state: Crawl.InProgressCrawlState,
	location: Crawl.Location,
	item: Item): Promise<Crawl.CrawlState> {
	let loc = { r: location.r, c: location.c };
	for (let i = 0; i < Math.max(state.floor.map.width, state.floor.map.height); i++) {
		for (let [dr, dc, di] of [[-1, 0, 0], [0, 1, 0], [1, 0, 1], [0, -1, 1]]) {
			for (let j = 0; j < 2 * i + di; j++) {
				if (utils.getTile(state.floor.map, loc).type === Crawl.DungeonTileType.FLOOR
					&& utils.getItemAtLocation(state, loc) === undefined) {
					let crawlItem = Object.assign(item, { location: loc });
					state.items.push(crawlItem);
					return;
				}
				loc.r += dr;
				loc.c += dc;
			}
		}
	}
}

function isValidMove(state: Crawl.CensoredInProgressCrawlState,
	entity: Crawl.CrawlEntity,
	direction: number): boolean {
	let offset: [number, number] = utils.decodeDirection(direction);
	let location = { r: entity.location.r + offset[0], c: entity.location.c + offset[1] };

	if (!utils.isLocationInMap(state.floor.map, location)) {
		return false;
	}

	if (!utils.isLocationEmpty(state, location)) {
		return false;
	}

	if (state.floor.map.grid[location.r][location.c].type === Crawl.DungeonTileType.WALL) {
		return false;
	}

	let startInCooridor = !utils.isLocationInRoom(state.floor.map, entity.location);
	let endInCooridor = !utils.isLocationInRoom(state.floor.map, location);

	if (direction % 2 === 1 && (startInCooridor || endInCooridor)) {
		return false;
	}

	return true;
}

function executeAttack(state: Crawl.InProgressCrawlState,
	entity: Crawl.CrawlEntity,
	action: Crawl.AttackAction): Promise<Crawl.CrawlState> {
	propagateLogEvent(state, {
		type: "attack",
		entity: {
			id: entity.id,
			name: entity.name,
			graphics: entity.graphics
		},
		location: entity.location,
		direction: action.direction,
		attack: action.attack
	});

	let targets = getTargets(state, entity, action.direction, action.attack.target);

	targets.forEach((target) => applyAttack(state, action.attack, entity, target));

	return Promise.resolve(state);
}

function getTargets(state: Crawl.InProgressCrawlState,
	attacker: Crawl.CrawlEntity,
	direction: number,
	selector: TargetSelector): Crawl.CrawlEntity[] {
	switch (selector.type) {
		case "self":
			return [attacker];

		case "team":
			let tts = selector as TeamTargetSelector;
			return state.entities.filter((entity) => entity.alignment === attacker.alignment
				&& (entity !== attacker || !tts.includeSelf));

		case "front":
			let offset: [number, number] = utils.decodeDirection(direction);
			let location = { r: attacker.location.r + offset[0], c: attacker.location.c + offset[1] };

			if (direction % 2 === 1 &&
				!(selector as FrontTargetSelector).cutsCorners &&
				(!utils.isLocationInRoom(state.floor.map, attacker.location)
					|| !utils.isLocationInRoom(state.floor.map, location))) {
				return [];
			}
			return state.entities.filter((entity) => utils.areLocationsEqual(entity.location, location));

		case "room":
			let room = state.floor.map.grid[attacker.location.r][attacker.location.c].roomId;
			let rts = selector as RoomTargetSelector;
			let selection = state.entities;

			if (room === undefined) {
				selection = selection.filter((entity) => utils.distance(attacker.location, entity.location) <= 2);
			} else {
				selection = state.entities.filter((entity) =>
					utils.inSameRoom(state.floor.map, attacker.location, entity.location));
			}

			return selection.filter((entity) => entity.alignment !== attacker.alignment
				|| (entity !== attacker && rts.includeAllies)
				|| (entity === attacker && rts.includeSelf));
	}
}

function applyAttack(state: Crawl.InProgressCrawlState,
	attack: Attack,
	attacker: Crawl.CrawlEntity,
	defender: Crawl.CrawlEntity): void {
	if (attack.accuracy !== "always" && Math.random() * 100 > attack.accuracy) {
		propagateLogEvent(state, {
			type: "miss",
			entity: {
				id: defender.id,
				name: defender.name,
				graphics: defender.graphics
			},
			location: defender.location,
		});
		return; // move missed
	}

	if (attack.power !== undefined) {
		let damage = computeDamage(attacker, defender, attack);
		defender.stats.hp.current -= damage;

		propagateLogEvent(state, {
			type: "stat",
			entity: {
				id: defender.id,
				name: defender.name,
				graphics: defender.graphics
			},
			location: defender.location,
			stat: "hp",
			change: -damage
		});
	}

	attack.onHit.forEach((effect: SecondaryStatEffect) => {
		switch (effect.stat) {
			case "attack":
				defender.stats.attack.modifier += effect.amount;
				break;

			case "defense":
				defender.stats.defense.modifier += effect.amount;
				break;
		}

		propagateLogEvent(state, {
			type: "stat",
			entity: {
				id: defender.id,
				name: defender.name,
				graphics: defender.graphics
			},
			location: defender.location,
			stat: effect.stat,
			change: effect.amount
		});
	});
}

function computeDamage(attacker: Entity, defender: Entity, attack: Attack): number {
	let a = getModifiedStat(attacker.stats.attack) + attack.power;
	let b = attacker.stats.level;
	let c = getModifiedStat(defender.stats.defense);
	let d = ((a - c) / 8) + (b * 43690 / 65536);

	if (d < 0) {
		return 0;
	}

	let baseDamage = (((d * 2) - c) + 10) + ((d * d) * 3276 / 65536);
	let multiplier = (Math.random() * 2 + 7) / 8;
	return Math.round(baseDamage * multiplier);
}

function getModifiedStat(stat: BaseModifierStat): number {
	let multiplier = 1;

	if (stat.modifier > 0) {
		multiplier = 2 - Math.pow(0.75, stat.modifier);
	} else if (stat.modifier < 0) {
		multiplier = Math.pow(0.75, -stat.modifier);
	}

	return stat.base * multiplier;
}

function executeItem(state: Crawl.InProgressCrawlState,
	entity: Crawl.CrawlEntity,
	action: Crawl.ItemAction): Promise<Crawl.CrawlState> {
	let item: Item;
	let held: boolean;

	for (let it of entity.items.held.items) {
		if (action.item === it.id) {
			item = it;
			held = true;
			break;
		}
	}

	if (entity.items.bag !== undefined) {
		for (let it of entity.items.bag.items) {
			if (action.item === it.id) {
				item = it;
				held = false;
				break;
			}
		}
	}

	if (item === undefined) {
		return Promise.resolve(state);
	}

	switch (action.action) {
		case "use":
			item.handlers[ItemHook.ITEM_USE](entity, state, item, held);
			if (held) {
				entity.items.held.items = entity.items.held.items.filter((it) => it.id !== item.id);
			} else {
				entity.items.bag.items = entity.items.bag.items.filter((it) => it.id !== item.id);
			}
			break;

		case "throw":
			break;

		case "drop":
			if (held) {
				entity.items.held.items = entity.items.held.items.filter((it) => it.id !== item.id);
			} else {
				entity.items.bag.items = entity.items.bag.items.filter((it) => it.id !== item.id);
			}
			executeItemDrop(state, entity.location, item);
			propagateLogEvent(state, {
				type: "item_drop",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				item
			});
			break;

		case "equip":
			entity.items.bag.items = entity.items.bag.items.filter((it) => it !== item);
			entity.items.held.items.push(item);
			break;

		case "unequip":
			entity.items.held.items = entity.items.held.items.filter((it) => it !== item);
			entity.items.bag.items.push(item);
			break;

		default:
			// ???
			break;
	}
	return Promise.resolve(state); // TODO
}

function executeStairs(state: Crawl.InProgressCrawlState,
	entity: Crawl.CrawlEntity,
	action: Crawl.StairsAction): Promise<Crawl.CrawlState> {
	if (state.floor.map.grid[entity.location.r][entity.location.c].stairs) {
		propagateLogEvent(state, {
			type: "stairs",
			entity: {
				name: entity.name,
				id: entity.id,
				graphics: entity.graphics
			}
		});

		state.entities.forEach((entity) => entity.controller.wait());

		let advancers = state.entities.filter((entity) => entity.advances);
		return advanceToFloor(state.dungeon, state.floor.number + 1, advancers).then((newState) => {
			return newState;
		});
	}

	return Promise.resolve(state);
}

export function propagateLogEvent(state: Crawl.InProgressCrawlState, event: Crawl.LogEvent): void {
	switch (event.type) {
		case "wait":
		case "attack":
		case "stat":
		case "miss":
			let evt: Crawl.Locatable = event as
				Crawl.WaitLogEvent | Crawl.AttackLogEvent | Crawl.StatLogEvent | Crawl.MissLogEvent as
				Crawl.Locatable;

			state.entities.forEach((entity) => {
				if (utils.isVisible(state.floor.map, entity.location, evt.location)) {
					entity.controller.pushEvent(event);
				}
			});

			break;


		case "move":
			let moveEvent = event as Crawl.MoveLogEvent;

			state.entities.forEach((entity) => {
				if (utils.isVisible(state.floor.map, entity.location, moveEvent.start)
					|| utils.isVisible(state.floor.map, entity.location, moveEvent.end)) {
					entity.controller.pushEvent(event);
				}
			});

			break;

		case "stairs":
		case "defeat":
		case "message":
		case "item_pickup":
		case "item_drop":
			state.entities.forEach((entity) => entity.controller.pushEvent(event));
			break;
	}
}

function updateMap(state: Crawl.InProgressCrawlState, entity: Crawl.CrawlEntity): void {
	let changed = false;

	let {r, c} = entity.location;

	utils.withinNSteps(2, entity.location, (loc) => {
		if (utils.isLocationInMap(state.floor.map, loc)
			&& utils.getTile(state.floor.map, loc) !== utils.getTile(entity.map, loc)) {
			entity.map.grid[loc.r][loc.c] = state.floor.map.grid[loc.r][loc.c];
			changed = true;
		}
	});

	if (utils.isLocationInRoom(state.floor.map, entity.location) && changed) {
		for (let i = 0; i < state.floor.map.height; i++) {
			for (let j = 0; j < state.floor.map.width; j++) {
				if (utils.isVisible(state.floor.map, entity.location, { r: i, c: j })) {
					entity.map.grid[i][j] = state.floor.map.grid[i][j];
				}
			}
		}
	}
}