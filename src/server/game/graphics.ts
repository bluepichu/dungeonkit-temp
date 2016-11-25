"use strict";

function makeDefaultAnimation(dir: number): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: { x: 12, y: 15 } },
				{ texture: "shadow", anchor: { x: 12, y: 5 } }
			],
			duration: 40
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 } },
				{ texture: "shadow", anchor: { x: 12, y: 5 } }
			],
			duration: 8
		},
		{
			sprites: [
				{ texture: `walk-${dir}c`, anchor: { x: 12, y: 15 } },
				{ texture: "shadow", anchor: { x: 12, y: 5 } }
			],
			duration: 8
		}
	];
}

function makeWalkAnimation(dir: number): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: { x: 12, y: 15 } },
				{ texture: "shadow", anchor: { x: 12, y: 5 } }
			],
			duration: 3
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 } },
				{ texture: "shadow", anchor: { x: 12, y: 5 } }
			],
			duration: 6
		},
		{
			sprites: [
				{ texture: `walk-${dir}c`, anchor: { x: 12, y: 15 } },
				{ texture: "shadow", anchor: { x: 12, y: 5 } }
			],
			duration: 6
		}
	];
}

function makeHurtAnimation(dir: number): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `hurt-${dir}`, anchor: { x: 12, y: 15 } },
				{ texture: "shadow", anchor: { x: 12, y: 5 } }
			],
			duration: 1000
		}
	];
}

function makeTackleAnimation(dir: number): AnimationDescriptor {
	return [
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: { x: 12, y: 15 }, offset: 0 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: { x: 12, y: 15 }, offset: -0.05 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: -0.05 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: { x: 12, y: 15 }, offset: -0.09 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: -0.09 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: { x: 12, y: 15 }, offset: -0.12 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: -0.12 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: { x: 12, y: 15 }, offset: -0.15 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: -0.15 }
			],
			duration: 4
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 }, offset: -0.15 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: -0.15 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 }, offset: -0.05 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: -0.05 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 }, offset: 0.05 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0.05 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 }, offset: 0.15 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0.15 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 }, offset: 0.25 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0.25 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 }, offset: 0.35 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0.35 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 }, offset: 0.45 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0.45 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 }, offset: 0.55 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0.55 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 }, offset: 0.65 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0.65 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}b`, anchor: { x: 12, y: 15 }, offset: 0.75 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0.75 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: { x: 12, y: 15 }, offset: 0.5 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0.5 }
			],
			duration: 1
		},
		{
			sprites: [
				{ texture: `walk-${dir}a`, anchor: { x: 12, y: 15 }, offset: 0.25 },
				{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0.25 }
			],
			duration: 1
		}
	];
}

function entityAnimations(base: string, dir: number): GraphicsObjectDescriptor {
	return {
		base,
		animations: {
			"default": makeDefaultAnimation(dir),
			"walk": makeWalkAnimation(dir),
			"hurt": makeHurtAnimation(dir),
			"tackle": makeTackleAnimation(dir)
		}
	};
}

let mudkipGraphics: EntityGraphicsDescriptor = {
	descriptors: {
		[0]: entityAnimations("mudkip", 0),
		[1]: entityAnimations("mudkip", 1),
		[2]: entityAnimations("mudkip", 2),
		[3]: entityAnimations("mudkip", 3),
		[4]: entityAnimations("mudkip", 4),
		[5]: entityAnimations("mudkip", 5),
		[6]: entityAnimations("mudkip", 6),
		[7]: entityAnimations("mudkip", 7)
	}
};

let eeveeGraphics: EntityGraphicsDescriptor = {
	descriptors: {
		[2]: entityAnimations("eevee", 2),
		[3]: entityAnimations("eevee", 3),
		[4]: entityAnimations("eevee", 4),
		[5]: entityAnimations("eevee", 5),
		[6]: entityAnimations("eevee", 6)
	},
	useReflection: true
};

function dungeonGraphicsAnimations(): { [key: string]: AnimationDescriptor } {
	let wallPatterns = [
		0xff,                                           // surrounded
		0x7f, 0xbf, 0xdf, 0xef, 0xf7, 0xfb, 0xfd, 0xfe, // one direction open
		0x3e, 0x8f, 0xe3, 0xf8,                         // one side open
		0xe0, 0x38, 0x0e, 0x83, 0x22, 0x88,             // two sides open
		0x80, 0x20, 0x08, 0x02,                         // three sides open
		0x00                                            // island
	];

	let ret: { [key: string]: AnimationDescriptor }  = {};

	for (let pattern = 0x00; pattern <= 0xff; pattern++) {
		for (let match of wallPatterns) {
			if ((match & pattern) === match) {
				let animName = "wall-" + ("00" + pattern.toString(16)).substr(-2);
				let frameName = "wall-" + ("00" + match.toString(16)).substr(-2);
				ret[animName] = [
					{ duration: 0, sprites: [ { texture: frameName, anchor: { x: 12, y: 5 } } ] }
				];
				break;
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

let dungeonGraphics: GraphicsObjectDescriptor = {
	base: "dng-proto",
	animations: dungeonGraphicsAnimations()
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

export const graphics: Map<string, GraphicsObjectDescriptor> = new Map([
	["dng-proto", dungeonGraphics],
	["item-seed", seedGraphics],
	["item-berry", berryGraphics],
	["item-scarf", scarfGraphics]
]);

export const entityGraphics: Map<string, EntityGraphicsDescriptor> = new Map([
	["mudkip", mudkipGraphics],
	["eevee", eeveeGraphics]
]);