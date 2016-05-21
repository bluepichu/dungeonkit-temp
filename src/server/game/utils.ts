"use strict";

import * as log             from "beautiful-log";
import {sprintf as sprintf} from "sprintf-js";

export function decodeDirection(direction: number): [number, number] {
	switch (direction % 8) {
		case 0:
			return [0, 1];
		case 1:
			return [-1, 1];
		case 2:
			return [-1, 0];
		case 3:
			return [-1, -1];
		case 4:
			return [0, -1];
		case 5:
			return [1, -1];
		case 6:
			return [1, 0];
		case 7:
			return [1, 1];
		default:
			throw new Error(sprintf("[Code 4] %d is not a valid direction.", direction));
	}
}

export function isLocationEqual(a: Game.Crawl.Location, b: Game.Crawl.Location): boolean {
	return (a.r === b.r) && (a.c === b.c);
}

export function getEntityAtLocation(state: Game.Crawl.InProgressCrawlState,
	                                location: Game.Crawl.Location): Game.Crawl.CrawlEntity | void;
export function getEntityAtLocation(state: Game.Crawl.CensoredInProgressCrawlState,
                                    location: Game.Crawl.Location): Game.Crawl.CensoredCrawlEntity | void;

export function getEntityAtLocation(state: Game.Crawl.InProgressCrawlState,
                                    location: Game.Crawl.Location): Game.Crawl.CrawlEntity | void {
	for (let i = 0; i < state.entities.length; i++) {
		if (isLocationEqual(location, state.entities[i].location)) {
			return state.entities[i];
		}
	}

	return undefined;
}

export function isLocationEmpty(state: Game.Crawl.CensoredInProgressCrawlState,
                                location: Game.Crawl.Location): boolean {
	return (getEntityAtLocation(state, location) === undefined);
}

export function isLocationInMap(map: Game.Crawl.Map, location: Game.Crawl.Location): boolean {
	return location.r >= 0
	    && location.c >= 0
	    && location.r < map.height
	    && location.c < map.width;
}

export function isCrawlOver(state: Game.Crawl.CrawlState): state is Game.Crawl.ConcludedCrawlState {
	return "success" in state;
}

export function bound(v: number, min: number, max: number): number {
	if (min > max) {
		throw new Error(sprintf("[Code 5] Max (%d) is less than min (%d).", max, min));
	}

	if (v < min) {
		return min;
	}

	if (v > max) {
		return max;
	}

	return v;
}

export function randint(min: number, max: number): number {
	if (min > max) {
		throw new Error(sprintf("[Code 5] Max (%d) is less than min (%d).", max, min));
	}

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function distance(a: Game.Crawl.Location, b: Game.Crawl.Location): number {
	return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

export function printMap(map: Game.Crawl.Map): void {
	for (let i = 0; i < map.height; i++) {
		let line = "";

		for (let j = 0; j < map.width; j++) {
			switch (map.grid[i][j].type) {
				case "wall":
					line += "<#262626>\u2591</>";
					break;

				case "open":
					if (map.grid[i][j].stairs) {
						line += "<#00afd7>\u25a3</>";
					} else if (map.grid[i][j].roomId > 0) {
						line += "<#87af00>" + String.fromCharCode(0x40 + map.grid[i][j].roomId) + "</>";
					} else {
						line += "<#0087ff>#</>";
					}
					break;

				default:
					line += "<gray>?</>";
					break;
			}
		}

		log.logf(line);
	}
	log.line(4);
}

export function printState(state: Game.Crawl.CensoredInProgressCrawlState): void {
	for (let i = 0; i < state.floor.map.height; i++) {
		let line = "";

		for (let j = 0; j < state.floor.map.width; j++) {
			let empty = true;

			for (let k = 0; k < state.entities.length; k++) {
				if (isLocationEqual(state.entities[k].location, { r: i, c: j })) {
					empty = false;
					break;
				}
			}

			if (empty) {
				switch (state.floor.map.grid[i][j].type) {
					case "wall":
						line += "<#262626>\u2591</>";
						break;

					case "open":
						if (state.floor.map.grid[i][j].stairs) {
							line += "<#00afd7>\u25a0</>";
						} else if (state.floor.map.grid[i][j].roomId > 0) {
							line += "<#444444>" + String.fromCharCode(0x40 + state.floor.map.grid[i][j].roomId) + "</>";
						} else {
							line += "<#303030>#</>";
						}
						break;

					default:
						line += "<gray>?</>";
						break;
				}
			} else {
				line += "<#ffff00>\u25cf</>";
			}
		}

		log.logf(line);
	}
	log.line(4);
}

export function tabulate<T>(fn: (i: number) => T, length: number): T[] {
	let ret: T[] = [];

	for (let i = 0; i < length; i++) {
		ret.push(fn(i));
	}

	return ret;
}

export function isLocationInRoom(map: Game.Crawl.Map, loc: Game.Crawl.Location) {
	return isLocationInMap(map, loc) && map.grid[loc.r][loc.c].roomId > 0;
}

export function inSameRoom(map: Game.Crawl.Map, a: Game.Crawl.Location, b: Game.Crawl.Location): boolean {
	return isLocationInRoom(map, a)
	    && isLocationInRoom(map, b)
	    && map.grid[a.r][a.c].roomId === map.grid[b.r][b.c].roomId;
}

export function visible(map: Game.Crawl.Map,
                        observer: Game.Crawl.Location,
                        location: Game.Crawl.Location): boolean {
	if (isLocationInRoom(map, observer)) {
		if (inSameRoom(map, observer, location)) {
			return true;
		}
	}
	return distance(observer, location) <= 2;
}