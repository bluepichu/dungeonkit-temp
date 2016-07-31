"use strict";

import * as log     from "beautiful-log";

import * as crawl   from "./crawl";
import * as Symbols from "./symbols";
import * as utils   from "../../common/utils";

type ItemHandler = (item: Game.Item, entity: Game.Crawl.UnplacedCrawlEntity) => any;

function getHandler(item: Game.Item, key: symbol): ItemHandler {
	if ((item as any)[key] !== undefined) {
		return ((item as any)[key]) as ItemHandler;
	}
	return (item: Game.Item, entity: Game.Crawl.CrawlEntity) => entity;
}

export function isValidAction(state: Game.Crawl.CensoredInProgressCrawlState,
	entity: Game.Crawl.CrawlEntity,
	action: Game.Crawl.Action): boolean {
	switch (action.type) {
		case "wait":
			return true;

		case "move":
			return isValidMove(state, entity, (action as Game.Crawl.MoveAction).direction);

		case "attack":
			return true;

		case "item":
			return true; // TODO

		case "stairs":
			return state.floor.map.grid[entity.location.r][entity.location.c].stairs;
	}
}

export function execute(state: Game.Crawl.InProgressCrawlState,
	entity: Game.Crawl.CrawlEntity,
	action: Game.Crawl.Action): Promise<Game.Crawl.CrawlState> {
	let result: Promise<Game.Crawl.CrawlState> = undefined;

	switch (action.type) {
		case "move":
			result = executeMove(state, entity, action as Game.Crawl.MoveAction);
			break;

		case "attack":
			result = executeAttack(state, entity, action as Game.Crawl.AttackAction);
			break;

		case "item":
			result = executeItem(state, entity, action as Game.Crawl.ItemAction);
			break;

		case "stairs":
			result = executeStairs(state, entity, action as Game.Crawl.StairsAction);
			break;

		default:
			result = Promise.resolve(state);
			break;
	}

	return result.then((newState) => postExecute(newState, entity));
}

function postExecute(state: Game.Crawl.CrawlState,
	entity: Game.Crawl.CrawlEntity): Game.Crawl.CrawlState {
	if (utils.isCrawlOver(state)) {
		return state;
	}

	let newState = state as Game.Crawl.InProgressCrawlState;

	newState.entities.filter((entity) => entity.stats.hp.current <= 0).forEach((entity: Game.Crawl.CrawlEntity) => {
		for (let item of entity.items.held.items) {
			getHandler(item, Symbols.ENTITY_DEFEAT)(item, entity);
			if (entity.stats.hp.current > 0) {
				return;
			}
		}

		if (entity.items.bag !== undefined) {
			for (let item of entity.items.bag.items) {
				getHandler(item, Symbols.ENTITY_DEFEAT)(item, entity);
				if (entity.stats.hp.current > 0) {
					return;
				}
			}
		}

		propagateLogEvent(newState, {
			type: "defeat",
			entity: {
				id: entity.id,
				name: entity.name,
				graphics: entity.graphics
			}
		});
	});

	newState.entities = newState.entities.filter((entity) => entity.stats.hp.current > 0);

	newState.entities.forEach((entity) => updateMap(newState, entity));

	entity.controller.updateState(crawl.getCensoredState(newState, entity));

	return newState;
}

function executeMove(state: Game.Crawl.InProgressCrawlState,
	entity: Game.Crawl.CrawlEntity,
	action: Game.Crawl.MoveAction): Promise<Game.Crawl.CrawlState> {
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

function executeItemPickup(state: Game.Crawl.InProgressCrawlState,
	entity: Game.Crawl.CrawlEntity): Promise<Game.Crawl.CrawlState> {
	let item = utils.getItemAtLocation(state, entity.location);

	if (item !== undefined) {
		if (entity.items.bag !== undefined && entity.items.bag.items.length < entity.items.bag.capacity) {
			entity.items.bag.items.push(item);
			state.floor.items.filter((it) => it !== item);
			return;
		}

		if (entity.items.held.items.length < entity.items.held.capacity) {
			entity.items.bag.items.push(item);
			state.floor.items.filter((it) => it !== item);
			return;
		}
	}

	return Promise.resolve(state);
}

function executeItemDrop(state: Game.Crawl.InProgressCrawlState,
	location: Game.Crawl.Location,
	item: Game.Crawl.CrawlItem): Promise<Game.Crawl.CrawlState> {
	let loc = { r: location.r, c: location.c };
	for (let i = 0; i < Math.max(state.floor.map.width, state.floor.map.height); i++) {
		for (let [dr, dc, di] of [[-1, 0, 0], [0, 1, 0], [1, 0, 1], [0, -1, 1]]) {
			for (let j = 0; j < 2 * i + di; i++) {
				if (utils.getTile(state.floor.map, loc).type === Game.Crawl.DungeonTileType.FLOOR
					&& utils.getItemAtLocation(state, loc) === undefined) {
					item.location = loc;
					state.floor.items.push(item);
					return Promise.resolve(state);
				}
			}
		}
	}

	// welp
	return Promise.resolve(state);
}

function isValidMove(state: Game.Crawl.CensoredInProgressCrawlState,
	entity: Game.Crawl.CrawlEntity,
	direction: number): boolean {
	let offset: [number, number] = utils.decodeDirection(direction);
	let location = { r: entity.location.r + offset[0], c: entity.location.c + offset[1] };

	if (!utils.isLocationInMap(state.floor.map, location)) {
		return false;
	}

	if (!utils.isLocationEmpty(state, location)) {
		return false;
	}

	if (state.floor.map.grid[location.r][location.c].type === Game.Crawl.DungeonTileType.WALL) {
		return false;
	}

	let startInCooridor = !utils.isLocationInRoom(state.floor.map, entity.location);
	let endInCooridor = !utils.isLocationInRoom(state.floor.map, location);

	if (direction % 2 === 1 && (startInCooridor || endInCooridor)) {
		return false;
	}

	return true;
}

function executeAttack(state: Game.Crawl.InProgressCrawlState,
	entity: Game.Crawl.CrawlEntity,
	action: Game.Crawl.AttackAction): Promise<Game.Crawl.CrawlState> {
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
	console.log(targets);

	targets.forEach((target) => applyAttack(state, action.attack, entity, target));

	return Promise.resolve(state);
}

function getTargets(state: Game.Crawl.InProgressCrawlState,
	attacker: Game.Crawl.CrawlEntity,
	direction: number,
	selector: Game.TargetSelector): Game.Crawl.CrawlEntity[] {
	switch (selector.type) {
		case "self":
			return [attacker];

		case "team":
			let tts = selector as Game.TeamTargetSelector;
			return state.entities.filter((entity) => entity.alignment === attacker.alignment
				&& (entity !== attacker || !tts.includeSelf));

		case "front":
			let offset: [number, number] = utils.decodeDirection(direction);
			let location = { r: attacker.location.r + offset[0], c: attacker.location.c + offset[1] };
			return state.entities.filter((entity) => utils.areLocationsEqual(entity.location, location));

		case "room":
			let room = state.floor.map.grid[attacker.location.r][attacker.location.c].roomId;
			let rts = selector as Game.RoomTargetSelector;
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

function applyAttack(state: Game.Crawl.InProgressCrawlState,
	attack: Game.Attack,
	attacker: Game.Crawl.CrawlEntity,
	defender: Game.Crawl.CrawlEntity): void {
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

	attack.onHit.forEach((effect: Game.SecondaryStatEffect) => {
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

function computeDamage(attacker: Game.Entity, defender: Game.Entity, attack: Game.Attack): number {
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

function getModifiedStat(stat: Game.BaseModifierStat): number {
	let multiplier = 1;

	if (stat.modifier > 0) {
		multiplier = 2 - Math.pow(0.75, stat.modifier);
	} else if (stat.modifier < 0) {
		multiplier = Math.pow(0.75, -stat.modifier);
	}

	return stat.base * multiplier;
}

function executeItem(state: Game.Crawl.InProgressCrawlState,
	entity: Game.Crawl.CrawlEntity,
	action: Game.Crawl.ItemAction): Promise<Game.Crawl.CrawlState> {
	return Promise.resolve(state); // TODO
}

function executeStairs(state: Game.Crawl.InProgressCrawlState,
	entity: Game.Crawl.CrawlEntity,
	action: Game.Crawl.StairsAction): Promise<Game.Crawl.CrawlState> {
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
		return crawl.advanceToFloor(state.dungeon, state.floor.number + 1, advancers).then((newState) => {
			return newState;
		});
	}

	return Promise.resolve(state);
}

function propagateLogEvent(state: Game.Crawl.InProgressCrawlState, event: Game.Crawl.LogEvent): void {
	switch (event.type) {
		case "wait":
		case "attack":
		case "stat":
		case "miss":
			let evt: Game.Crawl.Locatable = (event as any as Game.Crawl.Locatable);

			state.entities.forEach((entity) => {
				if (utils.isVisible(state.floor.map, entity.location, evt.location)) {
					entity.controller.pushEvent(event);
				}
			});

			break;


		case "move":
			let moveEvent = event as Game.Crawl.MoveLogEvent;

			state.entities.forEach((entity) => {
				if (utils.isVisible(state.floor.map, entity.location, moveEvent.start)
					|| utils.isVisible(state.floor.map, entity.location, moveEvent.end)) {
					entity.controller.pushEvent(event);
				}
			});

			break;

		case "stairs":
		case "defeat":
			state.entities.forEach((entity) => entity.controller.pushEvent(event));
			break;
	}
}

export function updateMap(state: Game.Crawl.InProgressCrawlState, entity: Game.Crawl.CrawlEntity): void {
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
