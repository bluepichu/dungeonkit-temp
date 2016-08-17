"use strict";

import * as clone       from "clone";
import * as shortid     from "shortid";
import {sprintf}        from "sprintf-js";

import * as controllers from "./game/controllers";
import * as crawl       from "./game/crawl";

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

function std(pattern: number): Graphics.DungeonTileSelector {
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

let dungeonGraphics: Graphics.DungeonGraphics = {
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

let tackle: Attack = {
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

let growl: Attack = {
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

let waterGun: Attack = {
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

let tailWhip: Attack = {
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

let swift: Attack = {
	name: "Swift",
	animation: "swift",
	description: "Inflicts damage on the target. It never misses.",
	target: {
		type: "front",
		includeAllies: false,
		cutsCorners: true
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
		max: 10,
		current: 10
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

type DeepProxyHandler = {
	get?(target: any, field: string | number | symbol): any,
	set?(target: any, field: string | number | symbol, value: any): void
};

function deepProxy<T>(obj: T, field: string, handler: DeepProxyHandler): T {
	function makeProxy(obj: T, [field, ...fields]: string[], handler: DeepProxyHandler): T {
		if (fields.length === 0) {
			let proxy: ProxyHandler<T> = { get: undefined, set: undefined };

			if (handler.get !== undefined) {
				proxy.get = (t: T, f: string | number | symbol) => f === field ? handler.get(t, f) : (t as any)[f];
			}

			if (handler.set !== undefined) {
				proxy.set = (t: T, f: string | number | symbol, v: any) => {
					if (f === field) {
						handler.set(t, f, v);
					} else {
						(t as any)[f] = v;
					}
					return true;
				};
			}

			return new Proxy(obj, proxy);
		}

		let innerProxy = makeProxy((obj as any)[field], fields, handler);

		return new Proxy(obj, {
			get(t: any, f: string | number | symbol) {
				if (f === field) {
					return innerProxy;
				}

				return (t as any)[f];
			}
		}) as T;
	};

	return makeProxy(obj, field.split("."), handler);
}

let seedGraphics: Graphics.StaticGraphicsObject = {
	type: "static",
	base: "item",
	frames: [
		{ texture: "seed", anchor: { x: 16, y: 16 } }
	]
};

let berryGraphics: Graphics.StaticGraphicsObject = {
	type: "static",
	base: "item",
	frames: [
		{ texture: "berry", anchor: { x: 16, y: 16 } }
	]
};

let scarfGraphics: Graphics.StaticGraphicsObject = {
	type: "static",
	base: "item",
	frames: [
		{ texture: "scarf", anchor: { x: 16, y: 16 } }
	]
};

let reviverSeed: ItemBlueprint = {
	name: "Reviver Seed",
	description: "Revives the user on defeat.  Fills the belly slightly when eaten.",
	graphics: seedGraphics,
	actions: {
		use: ["eat", "use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		[ItemHook.ENTITY_DEFEAT](entity: Crawl.CrawlEntity, state: Crawl.InProgressCrawlState, item: Item) {
			entity.stats.hp.current = entity.stats.hp.max;
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: sprintf(
					"<self>%s</self> was revived by the <item>Reviver Seed</item>!",
					entity.name)
			});
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: sprintf(
					"The <item>Reviver Seed</item> turned into a <item>Plain Seed</item>!",
					entity.name)
			});
			item.name = "Plain Seed";
			item.description = "Does nothing in particular.  Fills the belly slightly when eaten.";
			item.handlers = { [ItemHook.ITEM_USE]: item.handlers[ItemHook.ITEM_USE] };
		},
		[ItemHook.ITEM_USE](entity: Crawl.CrawlEntity, state: Crawl.InProgressCrawlState) {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: sprintf("<self>%s</self> ate the <item>Reviver Seed</item>!", entity.name)
			});
		}
	}
};

let oranBerry: ItemBlueprint = {
	name: "Oran Berry",
	description: "A sweet berry.  Heals 20 HP and fills the belly slightly when eaten.",
	graphics: berryGraphics,
	actions: {
		use: ["eat", "use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		[ItemHook.ITEM_USE](entity: Crawl.CrawlEntity, state: Crawl.InProgressCrawlState) {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: sprintf("<self>%s</self> ate the <item>Oran Berry</item>!", entity.name)
			});
			let newHp = Math.min(entity.stats.hp.max, entity.stats.hp.current + 20);
			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "hp",
				change: newHp - entity.stats.hp.current
			});
			entity.stats.hp.current = newHp;
		}
	}
};

let antidefenseScarf: ItemBlueprint = {
	name: "Antidefense Scarf",
	description: "Why did you equip this?!?",
	graphics: scarfGraphics,
	equip(entity: Crawl.UnplacedCrawlEntity) {
		return deepProxy(entity, "stats.defense.modifier", {
			get(target: BaseModifierStat, field: any): number {
				return target.modifier - 6;
			},
			set(target: BaseModifierStat, field: any, value: number): boolean {
				target.modifier += value - target.modifier;
				return true;
			}
		});
	},
	handlers: {},
	actions: {
		drop: ["drop"]
	}
};

export function generatePlayer(socket: SocketIO.Socket, name?: string = "Eevee"): Crawl.UnplacedCrawlEntity {
	return {
		id: shortid.generate(),
		name: name,
		stats: clone(eeveeStats),
		attacks: clone([tackle, growl, tailWhip, swift]),
		items: {
			held: {
				capacity: 2,
				items: [
					Object.assign({ id: shortid.generate() }, antidefenseScarf),
					Object.assign({ id: shortid.generate() }, reviverSeed)
				]
			},
			bag: { capacity: 16, items: [] }
		},
		controller: new controllers.SocketController(socket),
		alignment: 1,
		advances: true,
		graphics: "eevee"
	};
}

export let dungeon: Crawl.Dungeon = {
	name: "Prototypical Forest",
	floors: 4,
	direction: "up",
	difficulty: 3,
	graphics: dungeonGraphics,
	blueprint: [
		{
			range: [1, 4],
			blueprint: {
				generatorOptions: {
					width: { type: "binomial", n: 60, p: .8 },
					height: { type: "binomial", n: 60, p: .8 },
					features: features,
					limit: 100000,
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
					{ item: reviverSeed, density: { type: "binomial", n: 20, p: 1 } },
					{ item: oranBerry, density: { type: "binomial", n: 30, p: 1 } }
				]
			}
		}
	]
};