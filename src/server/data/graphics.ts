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

function entityAnimations(
		base: string,
		dir: number,
		pivot: Point,
		shadowPivot: Point,
		useWalkForDefault?: boolean): GraphicsObjectDescriptor {
	return {
		base,
		animations: {
			"default": useWalkForDefault
					? makeDefaultAnimationFromWalk(dir, pivot, shadowPivot)
					: makeDefaultAnimation(dir, pivot, shadowPivot),
			"walk": makeWalkAnimation(dir, pivot, shadowPivot),
			"hurt": makeHurtAnimation(dir, pivot, shadowPivot),
			"tackle": makeTackleAnimation(dir, pivot, shadowPivot),
			"swift": makeTackleAnimation(dir, pivot, shadowPivot),
			"growl": makeTackleAnimation(dir, pivot, shadowPivot),
			"tail-whip": makeTackleAnimation(dir, pivot, shadowPivot),
			"defeat": makeHurtAnimation(dir, pivot, shadowPivot),
			"throw": makeThrowAnimation(dir, pivot, shadowPivot)
		}
	};
}

let mudkipGraphics: EntityGraphicsDescriptor = {
	descriptors: {
		[0]: entityAnimations("mudkip", 0, { x: 12, y: 15 }, { x: 12, y: 5 }, true),
		[1]: entityAnimations("mudkip", 1, { x: 12, y: 15 }, { x: 12, y: 5 }, true),
		[2]: entityAnimations("mudkip", 2, { x: 12, y: 15 }, { x: 12, y: 5 }, true),
		[3]: entityAnimations("mudkip", 3, { x: 12, y: 15 }, { x: 12, y: 5 }, true),
		[4]: entityAnimations("mudkip", 4, { x: 12, y: 15 }, { x: 12, y: 5 }, true),
		[5]: entityAnimations("mudkip", 5, { x: 12, y: 15 }, { x: 12, y: 5 }, true),
		[6]: entityAnimations("mudkip", 6, { x: 12, y: 15 }, { x: 12, y: 5 }, true),
		[7]: entityAnimations("mudkip", 7, { x: 12, y: 15 }, { x: 12, y: 5 }, true)
	}
};

let eeveeGraphics: EntityGraphicsDescriptor = {
	descriptors: {
		[2]: entityAnimations("eevee", 2, { x: 16, y: 20 }, { x: 16, y: 18 }),
		[3]: entityAnimations("eevee", 3, { x: 16, y: 20 }, { x: 16, y: 18 }),
		[4]: entityAnimations("eevee", 4, { x: 16, y: 20 }, { x: 16, y: 18 }),
		[5]: entityAnimations("eevee", 5, { x: 16, y: 20 }, { x: 16, y: 18 }),
		[6]: entityAnimations("eevee", 6, { x: 16, y: 20 }, { x: 16, y: 18 })
	},
	useReflection: true
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

let seedGraphics: GraphicsObjectDescriptor = {
	base: "item",
	animations: {
		"default": [
			{
				duration: 0,
				sprites: [
					{ texture: "seed", anchor: { x: 16, y: 16 }}
				]
			}
		]
	}
};

let berryGraphics: GraphicsObjectDescriptor = {
	base: "item",
	animations: {
		"default": [
			{
				duration: 0,
				sprites: [
					{ texture: "berry", anchor: { x: 16, y: 16 }}
				]
			}
		]
	}
};

let stickGraphics: GraphicsObjectDescriptor = {
	base: "item",
	animations: {
		"default": [
			{
				duration: 0,
				sprites: [
					{ texture: "stick", anchor: { x: 16, y: 16 }}
				]
			}
		]
	}
};

let rockGraphics: GraphicsObjectDescriptor = {
	base: "item",
	animations: {
		"default": [
			{
				duration: 0,
				sprites: [
					{ texture: "gravelrock", anchor: { x: 16, y: 16 }}
				]
			}
		]
	}
};

let scarfGraphics: GraphicsObjectDescriptor = {
	base: "item",
	animations: {
		"default": [
			{
				duration: 0,
				sprites: [
					{ texture: "scarf", anchor: { x: 16, y: 16 }}
				]
			}
		]
	}
};

let pkmnSquareGraphics: GraphicsObjectDescriptor = {
	base: "bg",
	animations: {
		"default": [
			{
				duration: 0,
				sprites: [
					{ texture: "pkmn-square", anchor: { x: 0, y: 0 }}
				]
			}
		]
	}
};

let pondGraphics: GraphicsObjectDescriptor = {
	base: "bg",
	animations: {
		"default": [
			{
				duration: 0,
				sprites: [
					{ texture: "pond", anchor: { x: 0, y: 0 }}
				]
			}
		]
	}
};

export const graphics: Map<string, GraphicsObjectDescriptor> = new Map([
	["dng-proto", dungeonGraphics],
	["pkmn-square", pkmnSquareGraphics],
	["pond", pondGraphics],
	["item-seed", seedGraphics],
	["item-berry", berryGraphics],
	["item-scarf", scarfGraphics],
	["item-stick", stickGraphics],
	["item-rock", rockGraphics]
]);

export const entityGraphics: Map<string, EntityGraphicsDescriptor> = new Map([
	["mudkip", mudkipGraphics],
	["eevee", eeveeGraphics]
]);