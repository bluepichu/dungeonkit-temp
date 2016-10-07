"use strict";

import * as log   from "beautiful-log";

import * as utils from "../../common/utils";

/**
 * Pretty-prints a map to the console.
 * @param map - The map to print.
 */
export function printFloorMap(map: FloorMap): void {
	for (let i = 0; i < map.height; i++) {
		let line = "";

		for (let j = 0; j < map.width; j++) {
			switch (map.grid[i][j].type) {
				case DungeonTileType.WALL:
					line += "<#262626>\u2591</>";
					break;

				case DungeonTileType.FLOOR:
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

/**
 * Pretty-prints a state to the console.
 * @param state - The state to print.
 */
export function printState(state: CensoredInProgressCrawlState): void {
	for (let i = 0; i < state.floor.map.height; i++) {
		let line = "";

		for (let j = 0; j < state.floor.map.width; j++) {
			if (utils.isCrawlLocationEmpty(state, { r: i, c: j })) {
				switch (state.floor.map.grid[i][j].type) {
					case DungeonTileType.WALL:
						line += "<#262626>\u2591</>";
						break;

					case DungeonTileType.FLOOR:
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