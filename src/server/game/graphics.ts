"use strict";

let mudkipGraphics: EntityGraphicsDescriptor = {
	base: "mudkip",
	animations: {
		"default": [
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 } },
					{ texture: "shadow", anchor: { x: 12, y: 5 } }
				],
				duration: 40
			},
			{
				sprites: [
					{ texture: "walk-%(dir)db", anchor: { x: 12, y: 15 } },
					{ texture: "shadow", anchor: { x: 12, y: 5 } }
				],
				duration: 8
			},
			{
				sprites: [
					{ texture: "walk-%(dir)dc", anchor: { x: 12, y: 15 } },
					{ texture: "shadow", anchor: { x: 12, y: 5 } }
				],
				duration: 8
			}
		],
		"walk": [
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 } },
					{ texture: "shadow", anchor: { x: 12, y: 5 } }
				],
				duration: 3
			},
			{
				sprites: [
					{ texture: "walk-%(dir)db", anchor: { x: 12, y: 15 } },
					{ texture: "shadow", anchor: { x: 12, y: 5 } }
				],
				duration: 6
			},
			{
				sprites: [
					{ texture: "walk-%(dir)dc", anchor: { x: 12, y: 15 } },
					{ texture: "shadow", anchor: { x: 12, y: 5 } }
				],
				duration: 6
			}
		],
		"hurt": [
			{
				sprites: [
					{ texture: "hurt-%(dir)d", anchor: { x: 12, y: 15 }, offset: 0 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0 }
				],
				duration: 10
			},
			{
				sprites: [],
				duration: 10
			}
		],
		"tackle": [
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .04 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .04 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .08 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .08 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .12 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .12 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .16 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .16 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .20 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .20 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .24 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .24 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .20 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .20 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .16 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .16 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .12 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .12 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .08 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .08 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .04 },
					{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .04 }
				],
				duration: 1
			},
		]
	}
};

let eeveeGraphics: EntityGraphicsDescriptor = {
	base: "eevee",
	useReflection: true,
	animations: {
		"default": [
			{
				sprites: [
					{ texture: "idle-%(dir)da", anchor: { x: 16, y: 20 } },
					{ texture: "shadow", anchor: { x: 16, y: 18 } }
				],
				duration: 40
			},
			{
				sprites: [
					{ texture: "idle-%(dir)db", anchor: { x: 16, y: 20 } },
					{ texture: "shadow", anchor: { x: 16, y: 18 } }
				],
				duration: 40
			}
		],
		"walk": [
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 } },
					{ texture: "shadow", anchor: { x: 16, y: 18 } }
				],
				duration: 3
			},
			{
				sprites: [
					{ texture: "walk-%(dir)db", anchor: { x: 16, y: 20 } },
					{ texture: "shadow", anchor: { x: 16, y: 18 } }
				],
				duration: 6
			},
			{
				sprites: [
					{ texture: "walk-%(dir)dc", anchor: { x: 16, y: 20 } },
					{ texture: "shadow", anchor: { x: 16, y: 18 } }
				],
				duration: 6
			}
		],
		"hurt": [
			{
				sprites: [
					{ texture: "hurt-%(dir)d", anchor: { x: 16, y: 20 }, offset: 0 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: 0 }
				],
				duration: 1000
			}
		],
		"defeat": [
			{
				sprites: [
					{ texture: "hurt-%(dir)d", anchor: { x: 16, y: 20 }, offset: 0 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: 0 }
				],
				duration: 10
			},
			{
				sprites: [],
				duration: 10
			}
		],
		"tackle": [
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .04 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .04 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .08 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .08 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .12 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .12 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .16 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .16 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .20 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .20 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .24 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .24 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .20 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .20 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .16 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .16 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .12 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .12 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .08 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .08 }
				],
				duration: 1
			},
			{
				sprites: [
					{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .04 },
					{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .04 }
				],
				duration: 1
			},
		]
	}
};

eeveeGraphics.animations["growl"] = eeveeGraphics.animations["tackle"];
eeveeGraphics.animations["tail-whip"] = eeveeGraphics.animations["tackle"];
eeveeGraphics.animations["swift"] = eeveeGraphics.animations["tackle"];

export const graphics: EntityGraphicsCache = new Map([
	["mudkip", mudkipGraphics],
	["eevee", eeveeGraphics]
]);