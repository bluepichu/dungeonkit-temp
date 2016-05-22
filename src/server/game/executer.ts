"use strict";

import * as log   from "beautiful-log";

import * as crawl from "./crawl";
import * as utils from "./utils";

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
	}
}

export function execute(state: Game.Crawl.InProgressCrawlState,
                        entity: Game.Crawl.CrawlEntity,
                        action: Game.Crawl.Action): Game.Crawl.CrawlState {
	let result: Game.Crawl.CrawlState = state;

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
	}

	if (utils.isCrawlOver(result)) {
		return result;
	}

	let newState = result as Game.Crawl.InProgressCrawlState;

	newState.entities = newState.entities.filter((entity) => entity.stats.hp.current > 0); // this needs work

	for (let i = 0; i < newState.entities.length; i++) {
		let loc = newState.entities[i].location;

		if (newState.floor.map.grid[loc.r][loc.c].stairs && newState.entities[i].advances) {
			newState.entities.forEach((entity) => entity.controller.wait());

			let advancers = newState.entities.filter((entity) => entity.advances);
			return crawl.advanceToFloor(newState.dungeon, newState.floor.number + 1, advancers);
		}
	}

	console.time("maps");
	newState.entities.forEach((entity) => updateMap(newState, entity));
	console.timeEnd("maps");

	entity.controller.updateState(crawl.getCensoredState(newState, entity));

	return newState;
}

function executeMove(state: Game.Crawl.InProgressCrawlState,
                     entity: Game.Crawl.CrawlEntity,
                     action: Game.Crawl.MoveAction): Game.Crawl.CrawlState {
	let start = entity.location;

	if (isValidMove(state, entity, action.direction)) {
		let offset: [number, number] = utils.decodeDirection(action.direction);
		let location = { r: entity.location.r + offset[0], c: entity.location.c + offset[1] };

		entity.location = location;
	}

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

	return state;
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

	if (state.floor.map.grid[location.r][location.c].type === "wall") {
		return false;
	}

	let startInCooridor = state.floor.map.grid[entity.location.r][entity.location.c].roomId === 0;
	let endInCooridor = state.floor.map.grid[location.r][location.c].roomId === 0;

	if (direction % 2 === 1 && (startInCooridor || endInCooridor)) {
		return false;
	}

	return true;
}

function executeAttack(state: Game.Crawl.InProgressCrawlState,
                       entity: Game.Crawl.CrawlEntity,
                       action: Game.Crawl.AttackAction): Game.Crawl.CrawlState {
	let targets = getTargets(state, entity, action.direction, action.attack.target);

	targets.forEach((target) => applyAttack(action.attack, entity, target));

	return state;
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
			return state.entities.filter((entity) => utils.isLocationEqual(entity.location, location));

		case "room":
			let room = state.floor.map.grid[attacker.location.r][attacker.location.c].roomId;
			let rts = selector as Game.RoomTargetSelector;
			let selection = state.entities;

			if (room === 0) {
				selection = selection.filter((entity) => utils.distance(attacker.location, entity.location) <= 2);
			} else {
				return state.entities.filter((entity) => utils.inSameRoom(state.floor.map, attacker.location, entity.location));
			}

			return selection.filter((entity) => entity.alignment !== attacker.alignment
				|| (entity !== attacker && rts.includeAllies)
				|| (entity === attacker && rts.includeSelf));
	}
}

function applyAttack(attack: Game.Attack, attacker: Game.Crawl.CrawlEntity, defender: Game.Crawl.CrawlEntity): void {
	let damage = computeDamage(attacker, defender, attack); // TODO accuracy, all of the stuff that isn't damage, logging
	defender.stats.hp.current -= damage;
}

function computeDamage(attacker: Game.Entity, defender: Game.Entity, attack: Game.Attack): number {
	let a = getModifiedStat(attacker.stats.attack);
	let b = attacker.stats.level;
	let c = getModifiedStat(defender.stats.defense);
	let d = ((a - c) / 8) + (b * 43690 / 65536);
	return Math.round((((d * 2) - c) + 10) + ((d * d) * 3276 / 65536));
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

export function executeItem(state: Game.Crawl.InProgressCrawlState,
                            entity: Game.Crawl.CrawlEntity,
                            action: Game.Crawl.ItemAction): Game.Crawl.CrawlState {
	return state; // TODO
}

function propagateLogEvent(state: Game.Crawl.InProgressCrawlState, event: Game.Crawl.LogEvent): void {
	switch (event.type) {
		case "wait":
		case "attack":
		case "stat":
			let evt: Game.Crawl.Locatable = (event as any as Game.Crawl.Locatable);

			state.entities.forEach((entity) => {
				if (utils.visible(state.floor.map, entity.location, evt.location)) {
					entity.controller.pushEvent(event);
				}
			});

			break;


		case "move":
			let moveEvent = event as Game.Crawl.MoveLogEvent;

			state.entities.forEach((entity) => {
				if (utils.visible(state.floor.map, entity.location, moveEvent.start)
				 || utils.visible(state.floor.map, entity.location, moveEvent.end)) {
					entity.controller.pushEvent(event);
				}
			});

			break;

		case "stairs":
			state.entities.forEach((entity) => entity.controller.pushEvent(event));
			break;
	}
}

export function updateMap(state: Game.Crawl.InProgressCrawlState, entity: Game.Crawl.CrawlEntity): void {
	let changed = false;

	let {r, c} = entity.location;

	for (let i = 0; i < 8; i++) {
		let [dr, dc] = utils.decodeDirection(i);

		if (utils.inRange(r + dr, 0, state.floor.map.height)
		    && utils.inRange(c + dc, 0, state.floor.map.width)
		    && entity.map.grid[r + dr][c + dc] !== state.floor.map.grid[r + dr][c + dc]) {
			entity.map.grid[r + dr][c + dc] = state.floor.map.grid[r + dr][c + dc];
			changed = true;
		}

		for (let j = 0; j < 8; j++) {
			let [ddr, ddc] = utils.decodeDirection(j);

			if (utils.inRange(r + dr + ddr, 0, state.floor.map.height)
			    && utils.inRange(c + dc + ddc, 0, state.floor.map.width)
			    && entity.map.grid[r + dr + ddr][c + dc + ddc] !== state.floor.map.grid[r + dr + ddr][c + dc + ddc]) {
				entity.map.grid[r + dr + ddr][c + dc + ddc] = state.floor.map.grid[r + dr + ddr][c + dc + ddc];
				changed = true;
			}
		}
	}

	if (utils.isLocationInRoom(state.floor.map, entity.location) && changed) {
		for (let i = 0; i < state.floor.map.height; i++) {
			for (let j = 0; j < state.floor.map.width; j++) {
				if (utils.inSameRoom(state.floor.map, entity.location, { r: i, c: j })) {
					entity.map.grid[i][j] = state.floor.map.grid[i][j];
				} else {
					for (let k = 0; k < 8; k++) {
						let [di1, dj1] = utils.decodeDirection(k);

						if (utils.isLocationInMap(state.floor.map, { r: i + di1, c: j + dj1 })
						    && utils.inSameRoom(state.floor.map, entity.location, { r: i + di1, c: j + dj1 })) {
							entity.map.grid[i][j] = state.floor.map.grid[i][j];
							break;
						}

						for (let l = 0; l < 8; l++) {
							let [di2, dj2] = utils.decodeDirection(l);
							let [di, dj] = [di1 + di2, dj1 + dj2];

							if (utils.isLocationInMap(state.floor.map, { r: i + di, c: j + dj })
								&& utils.inSameRoom(state.floor.map, entity.location, { r: i + di, c: j + dj })) {
								entity.map.grid[i][j] = state.floor.map.grid[i][j];
								break;
							}
						}
					}
				}
			}
		}
	}
}
