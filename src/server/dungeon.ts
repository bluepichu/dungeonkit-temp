"use strict";

import * as shortid     from "shortid";
import {sprintf}        from "sprintf-js";

import * as controllers from "./game/controllers";

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
			"#        #",
			"#        #",
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

function std(pattern: number): Game.Graphics.DungeonTileSelector {
	return {
		pattern: pattern,
		object: {
			type: "static",
			frames: [
				{ texture: sprintf("wall-%02x", pattern), anchor: { x: 12, y: 5 } }
			]
		}
	};
}

let dungeonGraphics: Game.Graphics.DungeonGraphics = {
	base: "dng-proto",
	walls: [
		std(0xff), // surrounded
		std(0x7f), // one direction open
		std(0xbf),
		std(0xdf),
		std(0xef),
		std(0xf7),
		std(0xfb),
		std(0xfd),
		std(0xfe),
		std(0x3e), // one side open
		std(0x8f),
		std(0xe3),
		std(0xf8),
		std(0xe0), // two sides open
		std(0x38),
		std(0x0e),
		std(0x83),
		std(0x22),
		std(0x88),
		std(0x80), // three sides open
		std(0x20),
		std(0x08),
		std(0x02),
		std(0x00)  // island
	],
	open: {
		type: "static",
		frames: [{ texture: "open", anchor: { x: 12, y: 5 } }]
	},
	stairs: {
		type: "static",
		frames: [{ texture: "stairs", anchor: { x: 12, y: 5 } }]
	}
};

let features = {
	rooms: roomFeatures,
	corridors: corridorFeatures
};

let tackle: Game.Attack = {
	name: "Tackle",
	animation: "tackle",
	description: "Charges the foe with a full-body tackle.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 30,
		current: 30
	},
	accuracy: 95,
	power: 7,
	onHit: []
};

let growl: Game.Attack = {
	name: "Growl",
	animation: "growl",
	description: "Growls cutely to reduce the foe's ATTACK.",
	target: {
		type: "room",
		includeAllies: false,
		includeSelf: false
	},
	uses: {
		max: 30,
		current: 30
	},
	accuracy: "always",
	onHit: [
		{
			type: "stat",
			stat: "attack",
			amount: -1
		}
	]
};

let waterGun: Game.Attack = {
	name: "Water Gun",
	animation: "water-gun",
	description: "Squirts water to attack the foe.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 30,
		current: 30
	},
	accuracy: 88,
	power: 5,
	onHit: []
};

let tailWhip: Game.Attack = {
	name: "Tail Whip",
	animation: "tail-whip",
	description: "Lowers the target's Defense by one level.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 20,
		current: 20
	},
	accuracy: 100,
	onHit: [
		{
			type: "stat",
			stat: "defense",
			amount: -1
		}
	]
};

let swift: Game.Attack = {
	name: "Swift",
	animation: "swift",
	description: "Inflicts damage on the target. It never misses.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 8,
		current: 8
	},
	accuracy: "always",
	power: 10,
	onHit: []
};

let mudkipStats = {
	level: 10,
	hp: {
		max: 48,
		current: 48
	},
	attack: {
		base: 19,
		modifier: 0
	},
	defense: {
		base: 19,
		modifier: 0
	}
};

let eeveeStats = {
	level: 10,
	hp: {
		max: 48,
		current: 48
	},
	attack: {
		base: 21,
		modifier: 0
	},
	defense: {
		base: 21,
		modifier: 0
	}
};

export function generatePlayer(socket: SocketIO.Socket): Game.Crawl.UnplacedCrawlEntity {
	return {
		id: shortid.generate(),
		name: "Eevee",
		stats: eeveeStats,
		attacks: [tackle, growl, tailWhip, swift],
		bag: { capacity: 16, items: [] },
		controller: new controllers.SocketController(socket),
		alignment: 1,
		advances: true,
		graphics: "eevee"
	};
}

export let dungeon: Game.Crawl.Dungeon = {
	name: "Prototypical Forest",
	floors: 10,
	direction: "up",
	difficulty: 3,
	graphics: dungeonGraphics,
	blueprint: [
		{
			range: [1, 4],
			blueprint: {
				generatorOptions: {
					generator: "feature",
					options: {
						width: {
							min: 40,
							max: 60
						},
						height: {
							min: 40,
							max: 60
						},
						features: features,
						limit: 100000,
						cleanliness: .95
					}
				},
				enemies: [
					{
						density: 50,
						name: "Mudkip",
						graphics: "mudkip",
						stats: mudkipStats,
						attacks: [
							{ attack: tackle, weight: 1 },
							{ attack: growl, weight: 1 },
							{ attack: waterGun, weight: 1 }
						]
					}
				]
			}
		},
		{
			range: [5, 8],
			blueprint: {
				generatorOptions: {
					generator: "feature",
					options: {
						width: {
							min: 80,
							max: 100
						},
						height: {
							min: 60,
							max: 80
						},
						features: features,
						limit: 100000,
						cleanliness: .95
					}
				},
				enemies: []
			}
		},
		{
			range: [9, 10],
			blueprint: {
				generatorOptions: {
					generator: "feature",
					options: {
						width: {
							min: 120,
							max: 140
						},
						height: {
							min: 80,
							max: 100
						},
						features: features,
						limit: 100000,
						cleanliness: .95
					}
				},
				enemies: []
			}
		},
	]
};