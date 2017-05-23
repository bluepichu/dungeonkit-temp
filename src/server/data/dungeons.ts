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
	rock
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
	name: "Stormy Sea",
	floors: 4,
	direction: "up",
	difficulty: 3,
	graphics: "dng-stormy-sea",
	blueprint: [
		{
			range: [1, 4],
			blueprint: {
				type: "generated",
				generatorOptions: {
					width: { type: "uniform", a: 45, b: 60 },
					height: { type: "uniform", a: 45, b: 60 },
					features: {
						rooms: roomFeatures,
						corridors: corridorFeatures
					},
					limit: 1000,
					cleanliness: .95
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
					{ item: oranBerry, density: { type: "binomial", n: 20, p: 0.6 } },
					{ item: stick, density: { type: "binomial", n: 20, p: 0.6 } },
					{ item: rock, density: { type: "binomial", n: 20, p: 0.6 }}
				]
			}
		}
	]
};

let dungeons: Map<string, Dungeon> = new Map<string, Dungeon>();
dungeons.set("stormy-sea", dungeon);

export default dungeons;