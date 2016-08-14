/// <reference path="../../typings/index.d.ts"/>
/// <reference path="../types/game.d.ts"/>

"use strict";

import {sprintf}      from "sprintf-js";
import {inspect}      from "util";
import * as sourcemap from "source-map-support";

import * as utils     from "../common/utils";

sourcemap.install();

let testFloorBlueprint: Crawl.FloorBlueprint = {
	generatorOptions: {
		width: { type: "binomial", n: 10, p: 1 },
		height: { type: "binomial", n: 10, p: 1 },
		features: {
			rooms: [],
			corridors: []
		},
		limit: 10,
		cleanliness: 1
	},
	enemies: [],
	items: []
};

let testDungeon: Crawl.Dungeon = {
	name: "<Dungeon Name>",
	floors: 5,
	direction: "down",
	difficulty: 1,
	blueprint: [
		{
			range: [1, 3],
			blueprint: testFloorBlueprint
		},
		{
			range: [4, 5],
			blueprint: testFloorBlueprint
		}
	],
	graphics: undefined
};

let X = -1;

let testNumberGrid: number[][] = [
	[X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X],
	[X, X, X, X, X, 2, 2, 2, 2, 2, 2, X, X, X, X, X, X, X, X, X],
	[X, X, X, X, X, 2, 2, 2, 2, 2, 2, 2, X, X, X, X, X, X, X, X],
	[X, X, X, X, X, X, 2, 2, 2, 2, 2, 2, X, X, X, X, X, X, X, X],
	[X, X, X, X, X, X, 0, X, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, X, X],
	[X, X, X, X, X, X, 0, X, X, X, 2, 2, 2, X, X, X, X, 0, X, X],
	[X, 0, 0, X, 0, 0, 0, X, X, X, X, 0, X, X, X, X, X, 0, X, X],
	[X, X, 0, X, 0, X, X, X, X, X, X, 0, X, X, X, X, X, 0, X, X],
	[X, X, 0, X, 0, X, X, X, X, X, X, 0, 0, 0, 0, 0, X, 0, X, X],
	[X, X, 0, 0, 0, X, X, X, X, X, X, X, X, X, X, 0, X, 0, X, X],
	[X, X, 0, X, X, X, X, X, 0, 0, X, X, X, X, 3, 3, 3, 3, X, X],
	[X, X, 0, X, X, X, X, X, X, 0, X, X, X, 3, 3, 3, 3, 3, 3, X],
	[X, X, 0, X, X, X, X, X, X, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, X],
	[X, X, 0, X, X, X, X, X, X, X, X, X, X, 3, 3, 3, 3, 3, 3, X],
	[X, 1, 1, 1, 1, 1, 1, X, X, X, X, X, X, 3, 3, 3, 3, 3, 3, X],
	[X, 1, 1, 1, 1, 1, 1, X, X, X, X, X, X, X, 3, 3, 3, 3, X, X],
	[X, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, X, X, X, X, X],
	[X, 1, 1, 1, 1, 1, 1, X, X, X, X, X, X, X, X, X, X, X, X, X],
	[X, 1, 1, 1, 1, 1, 1, X, X, X, X, X, X, X, X, X, X, X, X, X],
	[X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X]
];

let testFloorGrid: Crawl.DungeonTile[][] = testNumberGrid.map((row) => row.map((cell) => {
	if (cell === X) {
		return { type: Crawl.DungeonTileType.WALL };
	}

	return { type: Crawl.DungeonTileType.FLOOR, roomId: cell === 0 ? undefined : cell };
}));

let testMap: Crawl.Map = {
	width: 20,
	height: 20,
	grid: testFloorGrid
};

let testEntity1: Crawl.CrawlEntity = {
	name: "<Test Entity 1 name>",
	id: "<Test Entity 1 id>",
	stats: undefined,
	attacks: undefined,
	graphics: undefined,
	map: undefined,
	items: undefined,
	controller: undefined,
	location: { r: 3, c: 6 },
	alignment: 1,
	advances: true
};

let testEntity2: Crawl.CrawlEntity = {
	name: "<Test Entity 2 name>",
	id: "<Test Entity 2 id>",
	stats: undefined,
	attacks: undefined,
	graphics: undefined,
	map: undefined,
	items: undefined,
	controller: undefined,
	location: { r: 15, c: 3 },
	alignment: 1,
	advances: true
};

let testEntity3: Crawl.CrawlEntity = {
	name: "<Test Entity 3 name>",
	id: "<Test Entity 3 id>",
	stats: undefined,
	attacks: undefined,
	graphics: undefined,
	map: undefined,
	items: undefined,
	controller: undefined,
	location: { r: 13, c: 15 },
	alignment: 0,
	advances: false
};

let testEntity4: Crawl.CrawlEntity = {
	name: "<Test Entity 4 name>",
	id: "<Test Entity 4 id>",
	stats: undefined,
	attacks: undefined,
	graphics: undefined,
	map: undefined,
	items: undefined,
	controller: undefined,
	location: { r: 14, c: 18 },
	alignment: 0,
	advances: false
};

let testInProgressState: Crawl.InProgressCrawlState = {
	dungeon: testDungeon,
	floor: {
		number: 2,
		map: testMap
	},
	entities: [testEntity1, testEntity2, testEntity3, testEntity4],
	items: []
};

let testConcludedSuccessState: Crawl.ConcludedCrawlState = {
	dungeon: testDungeon,
	success: true,
	floor: 5
};

let testConcludedFailureState: Crawl.ConcludedCrawlState = {
	dungeon: testDungeon,
	success: false,
	floor: 4
};



function eq(test: number, answer: number): void;
function eq(test: string, answer: string): void;
function eq<T>(test: T, answer: T): void;
function eq<T>(test: T[], answer: T[]): void;

function eq<T>(test: any, answer: any): void {
	if ((typeof test === "number") || (typeof test === "string") || (typeof test === "boolean")) {
		if (test !== answer) {
			throw new Error(sprintf("Expected %s but received %s.", inspect(answer), inspect(test)));
		}

		return;
	}

	if (Array.isArray(test)) {
		let testArr = test as T[];
		let answerArr = answer as T[];

		if (testArr.length !== answerArr.length) {
			throw new Error(sprintf("Expected array of length %d but received array of length %d.",
				answerArr.length,
				testArr.length));
		}

		for (let i = 0; i < test.length; i++) {
			try {
				eq(testArr[i], answerArr[i]);
			} catch (e) {
				throw new Error(sprintf("Expected %s at index %d but received %s.",
					inspect(answerArr[i]),
					i,
					inspect(testArr[i])));
			}
		}

		return;
	}

	for (let key in test) {
		if (!(key in answer)) {
			throw new Error(sprintf("Did not expect key \"%s\".", key));
		}

		try {
			eq(test[key], answer[key]);
		} catch (e) {
			throw new Error(sprintf("Expected %s at key \"%s\" but received %s.",
				inspect(answer[key]),
				key,
				inspect(test[key])));
		}
	}

	for (let key in answer) {
		if (!(key in test)) {
			throw new Error(sprintf("Expected key \"%s\".", key));
		}
	}
}

function assertError(f: () => any): void {
	let failed = true;

	try {
		f();
	} catch (e) {
		failed = false;
	}

	if (failed) {
		throw new Error("Expected an Error but none was thrown.");
	}
}

describe("server", () => {
	describe("game", () => {
		describe("utils", () => {
			describe("decodeDirection()", () => {
				it("should decode 0 properly.", () =>
					eq(utils.decodeDirection(0), [0, 1]));
				it("should decode 1 properly.", () =>
					eq(utils.decodeDirection(1), [-1, 1]));
				it("should decode 2 properly.", () =>
					eq(utils.decodeDirection(2), [-1, 0]));
				it("should decode 3 properly.", () =>
					eq(utils.decodeDirection(3), [-1, -1]));
				it("should decode 4 properly.", () =>
					eq(utils.decodeDirection(4), [0, -1]));
				it("should decode 5 properly.", () =>
					eq(utils.decodeDirection(5), [1, -1]));
				it("should decode 6 properly.", () =>
					eq(utils.decodeDirection(6), [1, 0]));
				it("should decode 7 properly.", () =>
					eq(utils.decodeDirection(7), [1, 1]));
				it("should mod positive numbers properly.", () =>
					eq(utils.decodeDirection(15), [1, 1]));
				it("should mod negative numbers properly.", () =>
					eq(utils.decodeDirection(-3), [1, -1]));
				it("should error on floats.", () =>
					assertError(() => utils.decodeDirection(3.14)));
			});

			describe("areLocationsEqual()", () => {
				it("should accept equal valid locations.", () =>
					eq(utils.areLocationsEqual({ r: 3, c: 8 }, { r: 3, c: 8 }), true));
				it("should accept equal invalid locations.", () =>
					eq(utils.areLocationsEqual({ r: -6, c: 2.2 }, { r: -6, c: 2.2 }), true));
				it("should reject unequal valid locations.", () =>
					eq(utils.areLocationsEqual({ r: 3, c: 8 }, { r: 1, c: 2 }), false));
				it("should reject unequal invalid locations.", () =>
					eq(utils.areLocationsEqual({ r: 3.14, c: -5 }, { r: -4, c: 2.17 }), false));
			});

			describe("getEntityAtLocation()", () => {
				it("should return the entity at the location if there is one.", () =>
					eq(utils.getEntityAtLocation(testInProgressState, { r: 3, c: 6 }), testEntity1));
				it("should return the entity at the location if there is one.", () =>
					eq(utils.getEntityAtLocation(testInProgressState, { r: 15, c: 3 }), testEntity2));
				it("should return the entity at the location if there is one.", () =>
					eq(utils.getEntityAtLocation(testInProgressState, { r: 13, c: 15 }), testEntity3));
				it("should return undefined if there is no entity at the location.", () =>
					eq(utils.getEntityAtLocation(testInProgressState, { r: 0, c: 0 }), undefined));
				it("should return undefined if there is no entity at the location.", () =>
					eq(utils.getEntityAtLocation(testInProgressState, { r: 12, c: 2 }), undefined));
				it("should return undefined if the location is invalid.", () =>
					eq(utils.getEntityAtLocation(testInProgressState, { r: 1.2, c: -1 }), undefined));
			});

			describe("isLocationEmpty()", () => {
				it("should return false if there is an entity in the location.", () =>
					eq(utils.isLocationEmpty(testInProgressState, { r: 3, c: 6 }), false));
				it("should return false if there is an entity in the location.", () =>
					eq(utils.isLocationEmpty(testInProgressState, { r: 15, c: 3 }), false));
				it("should return false if there is an entity in the location.", () =>
					eq(utils.isLocationEmpty(testInProgressState, { r: 13, c: 15 }), false));
				it("should return true if there is no entity at the location.", () =>
					eq(utils.isLocationEmpty(testInProgressState, { r: 0, c: 0 }), true));
				it("should return true if there is no entity at the location.", () =>
					eq(utils.isLocationEmpty(testInProgressState, { r: 12, c: 2 }), true));
				it("should return true if there is no entity at the location.", () =>
					eq(utils.isLocationEmpty(testInProgressState, { r: 1.2, c: -1 }), true));
			});

			describe("isLocationInMap()", () => {
				it("should accept in-bounds locations.", () =>
					eq(utils.isLocationInMap(testMap, { r: 4, c: 12 }), true));
				it("should reject locations with a row that is too high.", () =>
					eq(utils.isLocationInMap(testMap, { r: 20, c: 8 }), false));
				it("should reject locations with a column that is too high.", () =>
					eq(utils.isLocationInMap(testMap, { r: 4, c: 22 }), false));
				it("should reject locations with a row that is too low.", () =>
					eq(utils.isLocationInMap(testMap, { r: -2, c: 4 }), false));
				it("should reject locations with a column that is too low.", () =>
					eq(utils.isLocationInMap(testMap, { r: 0, c: -1 }), false));
			});

			describe("isCrawlOver()", () => {
				it("should accept concluded failed crawls.", () =>
					eq(utils.isCrawlOver(testConcludedFailureState), true));
				it("should accept concluded successful crawls.", () =>
					eq(utils.isCrawlOver(testConcludedSuccessState), true));
				it("should reject in-progress crawl states.", () =>
					eq(utils.isCrawlOver(testInProgressState), false));
			});

			describe("bound()", () => {
				it("should not affect valuees that fall within the range.", () =>
					eq(utils.bound(4.6, 2, 20), 4.6));
				it("should increase values that fall below the range.", () =>
					eq(utils.bound(1, 5, 10), 5));
				it("should decrease values that fall above the range.", () =>
					eq(utils.bound(20, -19, -4), -4));
				it("should allow a zero-size range.", () =>
					eq(utils.bound(2, 6, 6), 6));
				it("should not allow an invalid range.", () =>
					assertError(() => utils.bound(5, 19, 2)));
			});

			describe("randint()", () => {
				it("should return integer values in the given range.", () => {
					let min = Infinity;
					let max = -Infinity;

					for (let i = 0; i < 10000; i++) {
						let x = utils.randint(4, 8);

						if (!Number.isInteger(x)) {
							throw new Error(sprintf("Expected an integer but received %f.", x));
						}

						if (x < 4 || x > 8) {
							throw new Error(sprintf("Expected a value between 4 and 8 inclusive but received %d.", x));
						}

						min = Math.min(min, x);
						max = Math.max(max, x);
					}

					if (min !== 4 || max !== 8) {
						throw new Error(
							sprintf("Expected values in the range [4, 8] but received values in the range [%d, %d]."
								+ " (Note that this has a MINISCULE (< 1e-100) chance of failure.)",
								min,
								max));
					}
				});

				it("should not allow an invalid range.", () =>
					assertError(() => utils.randint(5, 4)));
			});

			describe("distance()", () => {
				it("should return 0 for equal locations.", () =>
					eq(utils.distance({ r: 3, c: 4 }, { r: 3, c: 4 }), 0));
				it("should return 1 for edgewise adjacent locations.", () =>
					eq(utils.distance({ r: 2, c: 2 }, { r: 1, c: 2 }), 1));
				it("should return 2 for diagonally adjacent locations.", () =>
					eq(utils.distance({ r: 0, c: 1 }, { r: 1, c: 0 }), 2));
				it("should work for larger distances.", () =>
					eq(utils.distance({ r: 15122, c: 15150 }, { r: 79345, c: 80180 }), 129253));
				it("should work for invalid locations.", () =>
					eq(utils.distance({ r: -1, c: 2.3 }, { r: 3.2, c: -9 }), 15.5));
			});

			// Tests for printMap omitted

			// Tests for printState omitted

			describe("tabulate", () => {
				it("should work for length-0 lists.", () => eq(utils.tabulate((i) => 0, 0), []));
				it("should work for length-1 lists.", () => eq(utils.tabulate((i) => 4, 1), [4]));

				it("should work for longer lists.", () => {
					let x = utils.tabulate((i) => Math.sin(i) + Math.cos(i), 1000);

					let ans: number[] = [];

					for (let i = 0; i < 1000; i++) {
						ans.push(Math.sin(i) + Math.cos(i));
					}

					eq(x, ans);
				});

				it("should round down the given length.", () =>
					eq(utils.tabulate((i) => i * i, 3.14), [0, 1, 4]));
				it("should return an empty list if the given length is negative.", () =>
					eq(utils.tabulate((i) => 2, -1), []));
				it("should work for non-numerical types.", () =>
					eq(utils.tabulate((i) => "sub".substring(i), 4), ["sub", "ub", "b", ""]));
			});

			describe("isLocationInRoom()", () => {
				it("should accept a location that is in a room.", () =>
					eq(utils.isLocationInRoom(testMap, { r: 2, c: 6 }), true));
				it("should accept a location that is in a room.", () =>
					eq(utils.isLocationInRoom(testMap, { r: 3, c: 9 }), true));
				it("should accept a location that is in a room.", () =>
					eq(utils.isLocationInRoom(testMap, { r: 15, c: 6 }), true));
				it("should accept a location that is in a room.", () =>
					eq(utils.isLocationInRoom(testMap, { r: 15, c: 17 }), true));
				it("should reject locations that are not in rooms.", () =>
					eq(utils.isLocationInRoom(testMap, { r: 10, c: 2 }), false));
				it("should reject locations that are not in rooms.", () =>
					eq(utils.isLocationInRoom(testMap, { r: 0, c: 0 }), false));
				it("should reject invalid locations.", () =>
					eq(utils.isLocationInRoom(testMap, { r: -3, c: 2 }), false));
				it("should reject invalid locations.", () =>
					eq(utils.isLocationInRoom(testMap, { r: 2.4, c: 3.5 }), false));
			});

			describe("inSameRoom()", () => {
				it("should accept locations that are in the same room.", () =>
					eq(utils.inSameRoom(testMap, { r: 2, c: 6 }, { r: 3, c: 9 }), true));
				it("should accept locations that are in the same room.", () =>
					eq(utils.inSameRoom(testMap, { r: 15, c: 6 }, { r: 18, c: 1 }), true));
				it("should reject locations that are not in the same room.", () =>
					eq(utils.inSameRoom(testMap, { r: 15, c: 6 }, { r: 3, c: 9 }), false));
				it("should reject locations that are not in rooms.", () =>
					eq(utils.inSameRoom(testMap, { r: 10, c: 2 }, { r: 16, c: 10 }), false));
				it("should reject locations that are not in rooms.", () =>
					eq(utils.inSameRoom(testMap, { r: 0, c: 0 }, { r: 1, c: 1 }), false));
				it("should reject invalid locations.", () =>
					eq(utils.inSameRoom(testMap, { r: 2.3, c: 4.3 }, { r: -1, c: 3 }), false));
			});

			describe("inRange()", () => {
				it("should accept values that are in range.", () =>
					eq(utils.inRange(19, 2, 100), true));
				it("should reject values that are below the range.", () =>
					eq(utils.inRange(-5, 0, 10), false));
				it("should reject values that are above range.", () =>
					eq(utils.inRange(64, -32, 16), false));
			});

			describe("isVisible()", () => {
				it("should accept locations that are in the same room.", () =>
					eq(utils.isVisible(testMap, { r: 2, c: 6 }, { r: 3, c: 9 }), true));
				it("should accept locations that are within a 2-tile distance.", () =>
					eq(utils.isVisible(testMap, { r: 8, c: 8 }, { r: 10, c: 8 }), true));
				it("should reject locations that aren't within a 2-tile distance or in the same room.", () =>
					eq(utils.isVisible(testMap, { r: 14, c: 18 }, { r: 2, c: 2 }), false));
				it("should reject invalid locations.", () =>
					eq(utils.isVisible(testMap, { r: 0, c: 0 }, { r: -1, c: 0 }), false));
			});

			describe("isValidLocation()", () => {
				it("should accept locations that are valid.", () =>
					eq(utils.isValidLocation({ r: 0, c: 0 }), true));
				it("should accept locations that are valid.", () =>
					eq(utils.isValidLocation({ r: 15150, c: 15251 }), true));
				it("should reject locations with a negative coordinate.", () =>
					eq(utils.isValidLocation({ r: -3, c: 0 }), false));
				it("should reject locations with a decimal coordinate.", () =>
					eq(utils.isValidLocation({ r: 2, c: 3.14 }), false));
			});

			describe("areAligned()", () => {
				it("should accept entities that are aligned.", () =>
					eq(utils.areAligned(testEntity1, testEntity2), true));
				it("should reject entities that are not aligned.", () =>
					eq(utils.areAligned(testEntity1, testEntity3), false));
				it("should reject entities that both have no alignment.", () =>
					eq(utils.areAligned(testEntity3, testEntity4), false));
			});
		});
	});
});