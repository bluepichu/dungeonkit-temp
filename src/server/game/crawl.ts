"use strict";

import * as generator from "./generator";
import * as printer   from "./printer";
import * as utils     from "../../common/utils";

import * as clone     from "clone";
import * as log       from "beautiful-log";
import {sprintf}      from "sprintf-js";

/**
 * Starts a new crawl in the given dungeon with the given entities.
 * @param dungeon - The dungeon for the crawl.
 * @param entities - The entities performing the crawl.
 * @return A promise for a concluded crawl.
 */
export function startCrawl(
	dungeon: Dungeon,
	entities: UnplacedCrawlEntity[]): Promise<ConcludedCrawlState> {
	if (validateDungeonBlueprint(dungeon)) {
		return advanceToFloor(dungeon, 1, entities)
			.then((state) => {
				if (utils.isCrawlOver(state)) {
					return Promise.resolve(state);
				} else {
					return step(state as InProgressCrawlState);
				}
			});
	} else {
		throw new Error(sprintf("[Code 1] Dungeon blueprint for dungeon '%s' failed validation.", dungeon.name));
	}
}

/**
 * Steps a crawl until it is completed.
 * @param state - The game to run.
 * @return A promise for a concluded crawl.
 */
function step(state: InProgressCrawlState): Promise<ConcludedCrawlState> {
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
		.then((action: Action) => {
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

/**
 * Checks all of an entity's items to see if any of them pertain to a particular item hook, as long as the given
 *     condition holds.
 * @param hook - The hook to check.
 * @param entity - The entity to check.
 * @param state - The game state.
 * @param condition - The condition that must hold for more items to be checked.
 */
function checkItems(
	hook: ItemHook,
	entity: CrawlEntity,
	state: InProgressCrawlState,
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

/**
 * Retrieves the next entity to move in the given state.
 * @param state - The state.
 * @return The next entity to move.
 */
function nextEntity(state: InProgressCrawlState): CrawlEntity {
	let next = state.entities.shift();
	state.entities.push(next);
	return next;
}

/**
 * Checks a dungeon blueprint's validity.
 * @param dungeon - The dungeon whose blueprint should be verified.
 * @return Whether or not the dungeon has a legal blueprint.
 */
function validateDungeonBlueprint(dungeon: Dungeon): boolean {
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

/**
 * Returns an in-progress crawl state on the given floor in the given dungeon, with the given entities performing the
 *     crawl.
 * @param dungeon - The dungeon in which the crawl is occuring.
 * @param floor - The floor to initialize.  Must be valid for the given dungeon.
 * @param entities - The entities performing the crawl.
 * @return An in-progress crawl state with the given entities performing a crawl on the given floor.
 */
function advanceToFloor(
	dungeon: Dungeon,
	floor: number,
	entities: UnplacedCrawlEntity[]): Promise<CrawlState> {
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
					updateFloorMap(state, entity);

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

/**
 * Returns the floor blueprint for the given floor in the given dungeon.
 * @param dungeon - The dungeon whose blueprint should be retreived.
 * @param floor - The floor number whose blueprint should be retreived.
 * @return The floor blueprint for the given floor in the given dungeon.
 */
function getFloorBlueprint(dungeon: Dungeon, floor: number): FloorBlueprint {
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

/**
 * Makes an object read-only.
 * @param obj - The object.
 * @return The read-only copy of the object.
 */
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

/**
 * Censors in an in-progress crawl state for a given entity.  This removes entities and items that the entity can't
 *     currently see and replaces the floor map with the entity's map.  It also adds a "self" field to the state for
 *     the entity to identify itself.
 * @param state - The in-progress crawl state to censor.
 * @param entity - The entity for which the state should be censored.
 * @return The given state censored for the given entity.
 */
function getCensoredState(
	state: InProgressCrawlState,
	entity: CrawlEntity): CensoredEntityCrawlState {
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
		entities: state.entities.filter((ent: CrawlEntity) =>
			utils.isVisible(state.floor.map, entity.location, ent.location)).map((ent) =>
				ent.alignment === entity.alignment ? censorSelf(ent) : censorEntity(ent)),
		items: state.items.filter((item: CrawlItem) =>
			utils.isVisible(state.floor.map, entity.location, item.location))
	});
}

/**
 * Censors a single entity.  This removes, for example, its items, stats, and attacks.
 * @param entity - The entity to censor.
 * @return The censored entity.
 */
function censorEntity(entity: CrawlEntity): CensoredCrawlEntity {
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

/**
 * Censors an entity for themself.  Currently only removes the controller for serialization, but may remove other
 *     server-only data in the future.
 * @param entity - The entity to censor.
 * @return The censored entity.
 */
function censorSelf(entity: CrawlEntity): CensoredSelfCrawlEntity {
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

/**
 * Checks if a given action is legal for a given entity in a given state.
 * @param state - The state in which to check the action.
 * @param entity - The entity for which to check the action.
 * @param action - The action to check.
 * @return Whether or not the action is legal.
 */
export function isValidAction(
	state: CensoredInProgressCrawlState,
	entity: CrawlEntity,
	action: Action): boolean {
	switch (action.type) {
		case "wait":
			return true;

		case "move":
			return isValidMove(state, entity, (action as MoveAction).direction);

		case "attack":
			return true;

		case "item":
			return true; // TODO

		case "stairs":
			return state.floor.map.grid[entity.location.r][entity.location.c].stairs;
	}
}

/**
 * Executes the given action for the given entity in the given state.  Action legality should first be verified with
 *     isValidAction().
 * @param state - The state in which to perform the action.
 * @param entity - The entity performing the action.
 * @param action - The action to execute.
 * @return A promise for a crawl state after the action was executed.
 */
function execute(
	state: InProgressCrawlState,
	entity: CrawlEntity,
	action: Action): Promise<CrawlState> {
	let result: Promise<CrawlState> = undefined;

	switch (action.type) {
		case "move":
			result = executeMove(state, entity, action as MoveAction);
			break;

		case "attack":
			result = executeAttack(state, entity, action as AttackAction);
			break;

		case "item":
			result = executeItem(state, entity, action as ItemAction);
			break;

		case "stairs":
			result = executeStairs(state, entity, action as StairsAction);
			break;

		default:
			result = Promise.resolve(state);
			break;
	}

	return result.then((newState) => postExecute(newState, entity));
}

/**
 * Gets run after an action is executed.  Checks, among other things, for defeated entities.
 * @param state - The state to check.
 * @param entity - The last entity to perform an action.
 * @return The state after these checks.
 */
function postExecute(state: CrawlState,
	entity: CrawlEntity): CrawlState {
	if (utils.isCrawlOver(state)) {
		return state;
	}

	let newState = state as InProgressCrawlState;

	newState.entities.filter((entity) => entity.stats.hp.current <= 0)
		.forEach((entity) =>
			checkItems(ItemHook.ENTITY_DEFEAT, entity, newState, () => entity.stats.hp.current <= 0));

	newState.entities.filter((entity) => entity.stats.hp.current <= 0)
		.forEach((entity) => {
			propagateLogEvent(newState, {
				type: "defeat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location
			});
			entity.items.held.items.forEach((item) => {
				executeItemDrop(newState, entity.location, item);
			});
		});

	newState.entities = newState.entities.filter((entity) => entity.stats.hp.current > 0);
	newState.entities.forEach((entity) => updateFloorMap(newState, entity));

	entity.controller.updateState(getCensoredState(newState, entity));

	return newState;
}

/**
 * Executes a move action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return A promise for the state after performing the action.
 */
function executeMove(
	state: InProgressCrawlState,
	entity: CrawlEntity,
	action: MoveAction): Promise<CrawlState> {
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

/**
 * Executes an item pickup action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return A promise for the state after performing the action.
 */
function executeItemPickup(state: InProgressCrawlState,
	entity: CrawlEntity): Promise<CrawlState> {
	let item = utils.getItemAtCrawlLocation(state, entity.location);

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

/**
 * Executes an item drop action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return A promise for the state after performing the action.
 */
function executeItemDrop(
	state: InProgressCrawlState,
	location: CrawlLocation,
	item: Item): Promise<CrawlState> {
	let loc = { r: location.r, c: location.c };
	for (let i = 0; i < Math.max(state.floor.map.width, state.floor.map.height); i++) {
		for (let [dr, dc, di] of [[-1, 0, 0], [0, 1, 0], [1, 0, 1], [0, -1, 1]]) {
			for (let j = 0; j < 2 * i + di; j++) {
				if (utils.getTile(state.floor.map, loc).type === DungeonTileType.FLOOR
					&& utils.getItemAtCrawlLocation(state, loc) === undefined) {
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

/**
 * Checks if a move action is legal.
 * @param state - The state.
 * @param entity - The entity.
 * @param direciton - The direction in which to move.
 * @return Whether or not the action is legal.
 */
function isValidMove(
	state: CensoredInProgressCrawlState,
	entity: CrawlEntity,
	direction: number): boolean {
	let offset: [number, number] = utils.decodeDirection(direction);
	let location = { r: entity.location.r + offset[0], c: entity.location.c + offset[1] };

	if (!utils.isCrawlLocationInFloorMap(state.floor.map, location)) {
		return false;
	}

	if (!utils.isCrawlLocationEmpty(state, location)) {
		return false;
	}

	if (state.floor.map.grid[location.r][location.c].type === DungeonTileType.WALL) {
		return false;
	}

	let startInCooridor = !utils.isCrawlLocationInRoom(state.floor.map, entity.location);
	let endInCooridor = !utils.isCrawlLocationInRoom(state.floor.map, location);

	if (direction % 2 === 1 && (startInCooridor || endInCooridor)) {
		return false;
	}

	return true;
}

/**
 * Executes an attack action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return A promise for the state after performing the action.
 */
function executeAttack(
	state: InProgressCrawlState,
	entity: CrawlEntity,
	action: AttackAction): Promise<CrawlState> {
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

/**
 * Retreives the targets for an attack.
 * @param state - The state.
 * @param attacker - The attacking entity.
 * @param direction - The direction that the attacker is facing.
 * @param selector - The attack's target selector.
 * @return A list of crawl entities targeted by the attack.
 */
function getTargets(
	state: InProgressCrawlState,
	attacker: CrawlEntity,
	direction: number,
	selector: TargetSelector): CrawlEntity[] {
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
				(!utils.isCrawlLocationInRoom(state.floor.map, attacker.location)
					|| !utils.isCrawlLocationInRoom(state.floor.map, location))) {
				return [];
			}
			return state.entities.filter((entity) => utils.areCrawlLocationsEqual(entity.location, location));

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

/**
 * Applies an attack to a single entity.
 * @param state - The state.
 * @param attack - The attack being performed.
 * @param attacker - The attacking entity.
 * @param defender - The defending entity.
 */
function applyAttack(
	state: InProgressCrawlState,
	attack: Attack,
	attacker: CrawlEntity,
	defender: CrawlEntity): void {
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

/**
 * Computes the damage for an attack.
 * @param attacker - The attacking entity.
 * @param defender - The defending entity.
 * @param attack - The attack being used.
 * @return The resulting damage on the defender.
 */
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

/**
 * Retreives a stat, as modified by stat modifiers.
 * @param stat - The stat to retrieve.
 * @return The modified stat.
 */
function getModifiedStat(stat: BaseModifierStat): number {
	let multiplier = 1;

	if (stat.modifier > 0) {
		multiplier = 2 - Math.pow(0.75, stat.modifier);
	} else if (stat.modifier < 0) {
		multiplier = Math.pow(0.75, -stat.modifier);
	}

	return stat.base * multiplier;
}

/**
 * Executes an item action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return A promise for the state after performing the action.
 */
function executeItem(
	state: InProgressCrawlState,
	entity: CrawlEntity,
	action: ItemAction): Promise<CrawlState> {
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

/**
 * Executes a stairs action.
 * @param state - The state.
 * @param entity - The entity.
 * @param action - The action.
 * @return The promise for the state after performing the action.
 */
function executeStairs(state: InProgressCrawlState,
	entity: CrawlEntity,
	action: StairsAction): Promise<CrawlState> {
	if (state.floor.map.grid[entity.location.r][entity.location.c].stairs) {
		propagateLogEvent(state, {
			type: "stairs",
			entity: {
				name: entity.name,
				id: entity.id,
				graphics: entity.graphics
			}
		});

		// state.entities.forEach((entity) => entity.controller.wait());

		let advancers = state.entities.filter((entity) => entity.advances);
		return advanceToFloor(state.dungeon, state.floor.number + 1, advancers).then((newState) => {
			return newState;
		});
	}

	return Promise.resolve(state);
}

/**
 * Delivers a log event to all entities that should receive it (usually based on location and/or alignment).
 * @param state - The state.
 * @param event - The event.
 */
export function propagateLogEvent(state: InProgressCrawlState, event: LogEvent): void {
	switch (event.type) {
		case "wait":
		case "attack":
		case "stat":
		case "miss":
			let evt: Locatable = event as
				WaitLogEvent | AttackLogEvent | StatLogEvent | MissLogEvent as
				Locatable;

			state.entities.forEach((entity) => {
				if (utils.isVisible(state.floor.map, entity.location, evt.location)) {
					entity.controller.pushEvent(event);
				}
			});

			break;


		case "move":
			let moveEvent = event as MoveLogEvent;

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

/**
 * Updates an entity's map.
 * @param state - The state.
 * @param entity - The entity.
 */
function updateFloorMap(state: InProgressCrawlState, entity: CrawlEntity): void {
	let changed = false;

	let {r, c} = entity.location;

	utils.withinNSteps(2, entity.location, (loc) => {
		if (utils.isCrawlLocationInFloorMap(state.floor.map, loc)
			&& utils.getTile(state.floor.map, loc) !== utils.getTile(entity.map, loc)) {
			entity.map.grid[loc.r][loc.c] = state.floor.map.grid[loc.r][loc.c];
			changed = true;
		}
	});

	if (utils.isCrawlLocationInRoom(state.floor.map, entity.location) && changed) {
		for (let i = 0; i < state.floor.map.height; i++) {
			for (let j = 0; j < state.floor.map.width; j++) {
				if (utils.isVisible(state.floor.map, entity.location, { r: i, c: j })) {
					entity.map.grid[i][j] = state.floor.map.grid[i][j];
				}
			}
		}
	}
}