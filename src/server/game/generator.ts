"use strict";

import * as log     from "beautiful-log";

import * as printer from "./printer";
import * as utils   from "./utils";

export function generateFloor(options: Game.Crawl.FeatureGeneratorOptions): Promise<Game.Crawl.Map> {
	return new Promise((resolve, _) => setTimeout(resolve, 0))
		.then(() => new Promise((resolve, reject) => {
		let open = 0;
		let width = utils.randint(options.width.min, options.width.max);
		let height = utils.randint(options.height.min, options.height.max);
		let roomId = 1;
		let choices: [number, number][] = [];

		let grid: number[][] = utils.tabulate((i) => utils.tabulate((j) => 0, width), height);
		// in this grid
		//    0 is undecided
		//    anything lower is a room (id = -value)
		//    9 is open (corridor)
		//    10 is wall
		//    1 is a right connection on a room
		//    2 ... top
		//    3 ... left
		//    4 ... bottom
		//    5 is a right connection on a corridor
		//    6 ... top
		//    7 ... left
		//    8 ... bottom

		let init = selectFeature(options.features.rooms);

		let r = utils.randint(0, height - init.height);
		let c = utils.randint(0, width - init.width);

		placeFeature(grid, r, c, init, choices, roomId);

		roomId++;

		for (let t = 0; t < options.limit; t++) {
			let [r, c] = choices[utils.randint(0, choices.length - 1)];

			if (0 < grid[r][c] && grid[r][c] < 9) {
				let placed: boolean = false;
				let feature: Game.Crawl.Feature = undefined;
				let isRoom: boolean = false;

				if (grid[r][c] < 5 || Math.random() < .5) {
					feature = selectFeature(options.features.corridors);
				} else {
					feature = selectFeature(options.features.rooms);
					isRoom = true;
				}

				for (let i = 0; i < feature.height; i++) {
					for (let j = 0; j < feature.width; j++) {
						if (canPlaceFeature(grid, r - i, c - j, feature, isRoom)) {
							placeFeature(grid, r - i, c - j, feature, choices, isRoom ? roomId++ : 0);
							placed = true;
							break;
						}
					}

					if (placed) {
						break;
					}
				}
			}
		}

		for (let i = 0; i < grid.length; i++) {
			for (let j = 0; j < grid[i].length; j++) {
				if (grid[i][j] === 9) {
					let adjacent = 0;

					for (let di = -1; di <= 1; di++) {
						for (let dj = -1; dj <= 1; dj++) {
							if (Math.abs(di) + Math.abs(dj) !== 1
								|| i + di < 0
								|| i + di > grid.length
								|| j + dj < 0
								|| j + dj > grid[i + di].length) {
								continue;
							}

							if (grid[i + di][j + dj] === 9 || grid[i + di][j + dj] < 0) {
								adjacent++;
							}
						}
					}

					if (adjacent <= 1 && Math.random() < options.cleanliness) {
						grid[i][j] = 10;
						i--;
						j--;
					}
				}
			}
		}

		resolve(gridToMap(grid));
	}));
}

function selectFeature(features: Game.Crawl.Feature[]): Game.Crawl.Feature {
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

function canPlaceFeature(grid: number[][],
                         r: number,
                         c: number,
                         feature: Game.Crawl.Feature,
                         isRoom: boolean): boolean {
	let matched: boolean = false;

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

function placeFeature(grid: number[][],
                      r: number,
                      c: number,
                      feature: Game.Crawl.Feature,
                      choices: [number, number][],
                      roomId: number): void {
	for (let i = 0; i < feature.height; i++) {
		for (let j = 0; j < feature.width; j++) {
			switch (feature.grid[i][j]) {
				case "#":
					grid[r + i][j + c] = 10;
					break;

				case ">":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 1 : 5;
						choices.push([r + i, j + c]);
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case "^":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 2 : 6;
						choices.push([r + i, j + c]);
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case "<":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 3 : 7;
						choices.push([r + i, j + c]);
					} else {
						grid[r + i][j + c] = 9;
					}
					break;

				case "v":
					if (grid[r + i][j + c] === 0) {
						grid[r + i][j + c] = (roomId > 0) ? 4 : 8;
						choices.push([r + i, j + c]);
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
}

function gridToMap(grid: number[][]): Game.Crawl.Map {
	return {
		width: grid[0].length,
		height: grid.length,
		grid: grid.map((row) => row.map(numberToTile))
	};
}

function numberToTile(val: number): Game.Crawl.DungeonTile {
	switch (val) {
		case 0:
			return { type: Game.Crawl.DungeonTileType.WALL };
		case 10:
			return { type: Game.Crawl.DungeonTileType.WALL };
		case 9:
			return { type: Game.Crawl.DungeonTileType.FLOOR };
		default:
			if (val > 0) {
				return { type: Game.Crawl.DungeonTileType.WALL };
			} else {
				return { type: Game.Crawl.DungeonTileType.FLOOR, roomId: -(val + 1) };
			}
	}
}

export function testGenerateFloor(): void {
	let options: Game.Crawl.FeatureGeneratorOptions = {
		width: {
			min: 120,
			max: 120,
		},
		height: {
			min: 45,
			max: 45,
		},
		features: {
			rooms: [
				{
					width: 10,
					height: 10,
					weight: 10,
					grid: [
						"##^#^#####",
						"#     #^##",
						"<        #",
						"<        >",
						"<        #",
						"<        #",
						"<        >",
						"#       ##",
						"##vv#   ##",
						"#######v##"
					],
				},
				{
					width: 10,
					height: 10,
					weight: 10,
					grid: [
						"########^#",
						"###^^#   #",
						"#<       >",
						"##       #",
						"#<       >",
						"#<       >",
						"##       #",
						"<        >",
						"#        #",
						"##vv#vvv##"
					]
				},
				{
					width: 10,
					height: 6,
					weight: 3,
					grid: [
						"####^^####",
						"###    ###",
						"#        #",
						"#        #",
						"###    ###",
						"####vv####",
					]
				},
				{
					width: 10,
					height: 7,
					weight: 4,
					grid: [
						"####^^^###",
						"#^#    ###",
						"<        >",
						"<  #    ##",
						"<      >##",
						"###   ####",
						"####vv####"
					]
				}
			],
			corridors: [
				{
					width: 6,
					height: 3,
					weight: 10,
					grid: [
						"######",
						"<    >",
						"######"
					]
				},
				{
					width: 3,
					height: 6,
					weight: 10,
					grid: [
						"#^#",
						"# #",
						"# #",
						"# #",
						"# #",
						"#v#"
					]
				},
				{
					width: 5,
					height: 4,
					weight: 5,
					grid: [
						"##^##",
						"<  ##",
						"##  >",
						"###v#"
					]
				},
				{
					width: 3,
					height: 3,
					weight: 3,
					grid: [
						"#^#",
						"< >",
						"#v#"
					]
				},
				{
					width: 4,
					height: 3,
					weight: 1,
					grid: [
						"####",
						"<  >",
						"####"
					]
				},
				{
					width: 3,
					height: 4,
					weight: 1,
					grid: [
						"#^#",
						"# #",
						"# #",
						"#v#"
					]
				}
			]
		},
		limit: 100000,
		cleanliness: .9
	};

	generateFloor(options)
		.then((map) => printer.printMap(map));
}