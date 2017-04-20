"use strict";

const letters = "abcdefghijklmnopqrstuvwxyz";

function makeDefaultAnimation(dir: number, pivot: Point, shadowPivot: Point): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `idle-${dir}a`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 20
		},
		{
			sprites: [
				{ texture: `idle-${dir}b`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 20
		}
	];
}

function makeDefaultAnimationFromWalk(dir: number, pivot: Point, shadowPivot: Point): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 40
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 8
		},
		{
			sprites: [
				{ texture: `walk-${dir}c`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 8
		}
	];
}

function makeWalkAnimation(dir: number, pivot: Point, shadowPivot: Point): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 3
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 6
		},
		{
			sprites: [
				{ texture: `walk-${dir}c`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 6
		}
	];
}

function makeThrowAnimation(dir: number, pivot: Point, shadowPivot: Point): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 8
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 8
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 8
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 8
		}
	];
}

function makeHurtAnimation(dir: number, pivot: Point, shadowPivot: Point): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `hurt-${dir}`, anchor: pivot },
				{ texture: "shadow", anchor: shadowPivot }
			],
			duration: 80
		}
	];
}

function makeTackleAnimation(dir: number, pivot: Point, shadowPivot: Point): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot, offset: -0.05 },
				{ texture: "shadow", anchor: shadowPivot, offset: -0.05 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot, offset: -0.09 },
				{ texture: "shadow", anchor: shadowPivot, offset: -0.09 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot, offset: -0.12 },
				{ texture: "shadow", anchor: shadowPivot, offset: -0.12 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot, offset: -0.15 },
				{ texture: "shadow", anchor: shadowPivot, offset: -0.15 }
			],
			duration: 4
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot, offset: -0.15 },
				{ texture: "shadow", anchor: shadowPivot, offset: -0.15 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot, offset: -0.05 },
				{ texture: "shadow", anchor: shadowPivot, offset: -0.05 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot, offset: 0.05 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0.05 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot, offset: 0.15 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0.15 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot, offset: 0.25 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0.25 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot, offset: 0.35 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0.35 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot, offset: 0.45 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0.45 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot, offset: 0.55 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0.55 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot, offset: 0.65 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0.65 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: pivot, offset: 0.75 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0.75 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot, offset: 0.5 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0.5 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: pivot, offset: 0.25 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0.25 }
			],
			duration: 1
		}
	];
}

function getSpinshockSprite(dir: number) {
	switch (dir) {
		case 0: return { texture: "spinshock-0", anchor: { x: 36, y: 20 }, offset: 0 };
		case 1: return { texture: "spinshock-1", anchor: { x: 20, y: 20 }, offset: 0 };
		case 2: return { texture: "spinshock-2", anchor: { x: 12, y: 20 }, offset: 0 };
		case 3: return { texture: "spinshock-3", anchor: { x: 12, y: 35 }, offset: 0 };
		case 4: return { texture: "spinshock-4", anchor: { x: 12, y: 44 }, offset: 0 };
		case 5: return { texture: "spinshock-5", anchor: { x: 26, y: 44 }, offset: 0 };
		case 6: return { texture: "spinshock-6", anchor: { x: 36, y: 44 }, offset: 0 };
		case 7: return { texture: "spinshock-7", anchor: { x: 36, y: 27 }, offset: 0 };
	}
}

function makeSpinshockAnimation(dir: number, pivot: Point, shadowPivot: Point): AnimationDescriptor {
	return [
		{
			sprites: [
				getSpinshockSprite((dir + 0) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 3
		},
		{
			sprites: [
				getSpinshockSprite((dir + 7) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				getSpinshockSprite((dir + 6) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 5) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 4) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 3) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 2) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 1) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 0) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 7) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 6) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 5) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 4) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				getSpinshockSprite((dir + 3) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				getSpinshockSprite((dir + 2) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 3
		},
		{
			sprites: [
				getSpinshockSprite((dir + 1) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 3
		},
		{
			sprites: [
				getSpinshockSprite((dir + 0) % 8),
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 5
		},
	];
}


function makeOverheatAnimation(dir: number, pivot: Point, shadowPivot: Point): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `overheat-${dir}a`, anchor: { x: 12, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}b`, anchor: { x: 12, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}c`, anchor: { x: 12, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}d`, anchor: { x: 24, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}e`, anchor: { x: 24, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}c`, anchor: { x: 12, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}d`, anchor: { x: 24, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}e`, anchor: { x: 24, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}c`, anchor: { x: 12, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}d`, anchor: { x: 24, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}e`, anchor: { x: 24, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}f`, anchor: { x: 24, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
		{
			sprites: [
				{ texture: `overheat-${dir}g`, anchor: { x: 12, y: 44 }, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 2
		},
	];
}

function makeCalmMindAnimation(dir: number, pivot: Point, shadowPivot: Point): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `walk-${(dir + 0) % 8}a`, anchor: pivot, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${(dir + 1) % 8}a`, anchor: pivot, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${(dir + 2) % 8}a`, anchor: pivot, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${(dir + 3) % 8}a`, anchor: pivot, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${(dir + 4) % 8}a`, anchor: pivot, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${(dir + 5) % 8}a`, anchor: pivot, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${(dir + 6) % 8}a`, anchor: pivot, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${(dir + 7) % 8}a`, anchor: pivot, offset: 0 },
				{ texture: "shadow", anchor: shadowPivot, offset: 0 }
			],
			duration: 1
		}
	];
}

function entityAnimations(
		base: string,
		dir: number,
		pivot: Point,
		shadowPivot: Point,
		attacks: string[],
		useWalkForDefault?: boolean): GraphicsObjectDescriptor {
	let desc: GraphicsObjectDescriptor = {
		base,
		animations: {
			"default": useWalkForDefault
					? makeDefaultAnimationFromWalk(dir, pivot, shadowPivot)
					: makeDefaultAnimation(dir, pivot, shadowPivot),
			"walk": makeWalkAnimation(dir, pivot, shadowPivot),
			"hurt": makeHurtAnimation(dir, pivot, shadowPivot),
			"defeat": makeHurtAnimation(dir, pivot, shadowPivot),
			"throw": makeThrowAnimation(dir, pivot, shadowPivot)
		}
	};

	for (let attack of attacks) {
		switch (attack) {
			case "growl":
			case "water-gun":
			case "tackle":
				desc.animations[attack] = makeTackleAnimation(dir, pivot, shadowPivot);
				break;

			case "spinshock":
				desc.animations["spinshock"] = makeSpinshockAnimation(dir, pivot, shadowPivot);
				break;

			case "overheat":
				desc.animations["overheat"] = makeOverheatAnimation(dir, pivot, shadowPivot);
				break;

			case "calm-mind":
				desc.animations["calm-mind"] = makeCalmMindAnimation(dir, pivot, shadowPivot);
				break;
		}
	}

	return desc;
}

let mudkipGraphics: EntityGraphicsDescriptor = {
	descriptors: {
		[0]: entityAnimations("mudkip", 0, { x: 12, y: 15 }, { x: 12, y: 5 }, ["tackle", "growl", "water-gun"], true),
		[1]: entityAnimations("mudkip", 1, { x: 12, y: 15 }, { x: 12, y: 5 }, ["tackle", "growl", "water-gun"], true),
		[2]: entityAnimations("mudkip", 2, { x: 12, y: 15 }, { x: 12, y: 5 }, ["tackle", "growl", "water-gun"], true),
		[3]: entityAnimations("mudkip", 3, { x: 12, y: 15 }, { x: 12, y: 5 }, ["tackle", "growl", "water-gun"], true),
		[4]: entityAnimations("mudkip", 4, { x: 12, y: 15 }, { x: 12, y: 5 }, ["tackle", "growl", "water-gun"], true),
		[5]: entityAnimations("mudkip", 5, { x: 12, y: 15 }, { x: 12, y: 5 }, ["tackle", "growl", "water-gun"], true),
		[6]: entityAnimations("mudkip", 6, { x: 12, y: 15 }, { x: 12, y: 5 }, ["tackle", "growl", "water-gun"], true),
		[7]: entityAnimations("mudkip", 7, { x: 12, y: 15 }, { x: 12, y: 5 }, ["tackle", "growl", "water-gun"], true)
	}
};

let pivot = { x: 12, y: 15 };
let shadowPivot = { x: 12, y: 6 };
let attacks = ["tackle", "spinshock", "overheat", "calm-mind"];

let toasterGraphics: EntityGraphicsDescriptor = {
	descriptors: {
		[0]: entityAnimations("toaster", 0, pivot, shadowPivot, attacks, true),
		[1]: entityAnimations("toaster", 1, pivot, shadowPivot, attacks, true),
		[2]: entityAnimations("toaster", 2, pivot, shadowPivot, attacks, true),
		[3]: entityAnimations("toaster", 3, pivot, shadowPivot, attacks, true),
		[4]: entityAnimations("toaster", 4, pivot, shadowPivot, attacks, true),
		[5]: entityAnimations("toaster", 5, pivot, shadowPivot, attacks, true),
		[6]: entityAnimations("toaster", 6, pivot, shadowPivot, attacks, true),
		[7]: entityAnimations("toaster", 7, pivot, shadowPivot, attacks, true)
	}
};

function dungeonGraphicsAnimations(patternCounts: { [key: number]: number }): { [key: string]: AnimationDescriptor } {
	let ret: { [key: string]: AnimationDescriptor }  = {};

	for (let pattern = 0; pattern <= 0xff; pattern++) {
		if (patternCounts[pattern]) {
			let name = "wall-" + ("00" + pattern.toString(16)).substr(-2);
			for (let i = 0; i < patternCounts[pattern]; i++) {
				ret[`${name}-${letters.charAt(i)}`] = [
					{ duration: 0, sprites: [ { texture: `${name}-${letters.charAt(i)}`, anchor: { x: 12, y: 5 } } ] }
				];
			}
		}
	}

	ret["stairs"] = [
		{ duration: 0, sprites: [ { texture: "stairs", anchor: { x: 12, y: 5 } } ] }
	];

	ret["default"] = [
		{ duration: 0, sprites: [ { texture: "open", anchor: { x: 12, y: 5 } } ] }
	];

	return ret;
}

function bitCount(num: number) {
	let cnt = 0;

	while (num > 0) {
		if (num & 1) {
			cnt++;
		}
		num >>= 1;
	}

	return cnt;
}

let tiles = [
	[ "w-10000011", "w-10001111", "w-00001110", "w-10000010", "w-10001000", "w-00001010", "w-10001010", "w-10001111", "w-00101010", "open", "stairs" ],
	[ "w-11100011", "w-11111111", "w-00111110", "w-00100010", "w-00000000", "w-10111011", "w-11100011", "w-11111111", "w-00111110" ],
	[ "w-11100000", "w-11111000", "w-00111000", "w-10100000", "w-11101110", "w-00101000", "w-10100010", "w-11111000", "w-10101000" ],
	[ "w-10001010", "w-00000010", "w-00101010", "w-11111110", "w-11111010", "w-11111011", "w-10111110", "w-10101111", "w-11101011" ],
	[ "w-10000000", "w-10101010", "w-00001000", "w-10111110", "w-11111111", "w-11101011", "w-11111110", "w-11111011" ],
	[ "w-10100010", "w-00100000", "w-10101000", "w-10111111", "w-10101111", "w-11101111", "w-10111111", "w-11101111" ],
	[ "w-11100010", "w-00111010", "w-10001110", "w-10001011", "w-10101011", "w-10101110", "w-11111110", "w-11111011", "w-11100010", "w-00111010", "w-10001110", "w-10001011" ],
	[ "w-10100011", "w-00101110", "w-10111000", "w-11101000", "w-11101010", "w-10111010", "w-10111111", "w-11101111", "w-10100011", "w-00101110", "w-10111000", "w-11101000" ]
];

let counts: { [key: number]: number } = {};

for (let row of tiles) {
	for (let tile of row) {
		if (tile.split("-").length > 1) {
			let idx = parseInt(tile.split("-")[1], 2);
			counts[idx] = counts[idx] || 0;
			counts[idx]++;
		}
	}
}

let dungeonGraphics: GraphicsObjectDescriptor = {
	base: "dng-stormy-sea",
	animations: dungeonGraphicsAnimations(counts)
};

function staticDescriptor(base: string, texture: string, position: Point = { x: 8, y: 4 }): GraphicsObjectDescriptor {
	return {
		base,
		animations: {
			"default": [
				{
					duration: 0,
					sprites: [
						{ texture, anchor: position}
					]
				}
			]
		}
	};
}

export const graphics: Map<string, GraphicsObjectDescriptor> = new Map([
	["dng-proto", dungeonGraphics],
	["pkmn-square", staticDescriptor("bg", "pkmn-square", { x: 0, y: 0 })],
	["pond", staticDescriptor("bg", "pond", { x: 0, y: 0 })],
	["item-screwdriver", staticDescriptor("item", "screwdriver")],
	["item-battery", staticDescriptor("item", "battery")],
	["item-paprika", staticDescriptor("item", "paprika")],
	["item-cayenne", staticDescriptor("item", "cayenne")],
	["item-turmeric", staticDescriptor("item", "turmeric")],
	["item-oregano", staticDescriptor("item", "oregano")],
	["item-cinnamon", staticDescriptor("item", "cinnamon")],
	["item-peppercorn", staticDescriptor("item", "peppercorn")],
	["item-spare-parts", staticDescriptor("item", "spare-parts")],
	["item-salt", staticDescriptor("item", "salt")]
]);

export const entityGraphics: Map<string, EntityGraphicsDescriptor> = new Map([
	["mudkip", mudkipGraphics],
	["toaster", toasterGraphics]
]);
