"use strict";

export let testFloorBlueprint: Crawl.FloorBlueprint = {
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

export let testDungeon: Crawl.Dungeon = {
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

export let testNumberGrid: number[][] = [
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

export let testFloorGrid: Crawl.DungeonTile[][] = testNumberGrid.map((row, r) => row.map((cell, c) => {
	if (cell === X) {
		return { type: Crawl.DungeonTileType.WALL };
	}

	return {
		type: Crawl.DungeonTileType.FLOOR,
		roomId: cell === 0 ? undefined : cell,
		stairs: r === 17 && c === 2
	};
}));

export let testMap: Crawl.Map = {
	width: 20,
	height: 20,
	grid: testFloorGrid
};

export let testItem1: Item = {
	id: "<Test Item 1 id>",
	name: "<Test Item 1 name>",
	description: "<Test Item 1 description>",
	handlers: {},
	graphics: undefined
};

export let testItem2: Item = {
	id: "<Test Item 2 id>",
	name: "<Test Item 2 name>",
	description: "<Test Item 2 description>",
	handlers: {},
	graphics: undefined
};

export let testItem3: Crawl.CrawlItem = {
	id: "<Test Item 3 id>",
	name: "<Test Item 3 name>",
	description: "<Test Item 3 description>",
	handlers: {},
	graphics: undefined,
	location: { r: 2, c: 6 }
};

export let testItem4: Crawl.CrawlItem = {
	id: "<Test Item 4 id>",
	name: "<Test Item 4 name>",
	description: "<Test Item 4 description>",
	handlers: {},
	graphics: undefined,
	location: { r: 12, c: 16 }
};

export let testBag: ItemSet = {
	capacity: 8,
	items: [testItem2]
};

export let testEntity1: Crawl.CrawlEntity = {
	name: "<Test Entity 1 name>",
	id: "<Test Entity 1 id>",
	stats: undefined,
	attacks: undefined,
	graphics: undefined,
	map: undefined,
	items: {
		held: { capacity: 1, items: [testItem1] },
		bag: testBag
	},
	controller: undefined,
	location: { r: 3, c: 6 },
	alignment: 1,
	advances: true
};

export let testEntity2: Crawl.CrawlEntity = {
	name: "<Test Entity 2 name>",
	id: "<Test Entity 2 id>",
	stats: undefined,
	attacks: undefined,
	graphics: undefined,
	map: undefined,
	items: {
		held: { capacity: 1, items: [] },
		bag: testBag
	},
	controller: undefined,
	location: { r: 15, c: 3 },
	alignment: 1,
	advances: true
};

export let testEntity3: Crawl.CrawlEntity = {
	name: "<Test Entity 3 name>",
	id: "<Test Entity 3 id>",
	stats: undefined,
	attacks: undefined,
	graphics: undefined,
	map: undefined,
	items: {
		held: { capacity: 1, items: [] }
	},
	controller: undefined,
	location: { r: 13, c: 15 },
	alignment: 0,
	advances: false
};

export let testEntity4: Crawl.CrawlEntity = {
	name: "<Test Entity 4 name>",
	id: "<Test Entity 4 id>",
	stats: undefined,
	attacks: undefined,
	graphics: undefined,
	map: undefined,
	items: {
		held: { capacity: 1, items: [] }
	},
	controller: undefined,
	location: { r: 14, c: 18 },
	alignment: 0,
	advances: false
};

export let testInProgressState: Crawl.InProgressCrawlState = {
	dungeon: testDungeon,
	floor: {
		number: 2,
		map: testMap
	},
	entities: [testEntity1, testEntity2, testEntity3, testEntity4],
	items: [testItem3, testItem4]
};

export let testConcludedSuccessState: Crawl.ConcludedCrawlState = {
	dungeon: testDungeon,
	success: true,
	floor: 5
};

export let testConcludedFailureState: Crawl.ConcludedCrawlState = {
	dungeon: testDungeon,
	success: false,
	floor: 4
};