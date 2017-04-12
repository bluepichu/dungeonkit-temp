"use strict";

import { mudkipStats }  from "./stats";

import {
	tackle,
	tailWhip,
	growl,
	waterGun,
	swift
} from "./attacks";

import {
	oranBerry,
	reviverSeed,
	stick,
	rock,
	totterSeed,
	shockerSeed
} from "./items";

let roomFeatures = [
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
		height: 8,
		weight: 3,
		grid: [
			"####^^####",
			"###    ###",
			"##      ##",
			"<        >",
			"<        >",
			"##      ##",
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
			"<      ###",
			"###   ####",
			"####vv####"
		]
	}
];

let corridorFeatures = [
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
];

let dungeon: Dungeon = {
	name: "Prototypical Forest",
	floors: 4,
	direction: "up",
	difficulty: 3,
	graphics: "dng-proto",
	blueprint: [
		{
			range: [1, 4],
			blueprint: {
				generatorOptions: {
					width: { type: "uniform", a: 3, b: 4 },
					height: { type: "uniform", a: 3, b: 4 },
					scale: 15,
					features: {
						rooms: roomFeatures,
						// corridors: corridorFeatures
					},
					// limit: 100000,
					// cleanliness: .95
					rooms: { type: "uniform", a: 4, b: 8 },
					junctions: { type: "uniform", a: 2, b: 4 }
				},
				enemies: [
					{
						density: { type: "binomial", n: 10, p: .4 },
						name: "Mudkip",
						graphics: "mudkip",
						stats: mudkipStats,
						attacks: [
							{ attack: tackle, weight: 1 },
							{ attack: growl, weight: 1 },
							{ attack: waterGun, weight: 1 }
						]
					}
				],
				items: [
					{ item: reviverSeed, density: { type: "binomial", n: 20, p: 0.6 } },
					{ item: totterSeed, density: { type: "binomial", n: 20, p: 0.6 } },
					{ item: shockerSeed, density: { type: "binomial", n: 20, p: 0.6 } },
					{ item: oranBerry, density: { type: "binomial", n: 20, p: 0.6 } },
					{ item: stick, density: { type: "binomial", n: 20, p: 0.6 } },
					{ item: rock, density: { type: "binomial", n: 20, p: 0.6 } }
				]
			}
		}
	]
};

let dungeons: Map<string, Dungeon> = new Map<string, Dungeon>();
dungeons.set("proto-forest", dungeon);

export default dungeons;