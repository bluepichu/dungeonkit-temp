"use strict";

let mudkipGraphics: EntityGraphics = {
	base: "mudkip",
	type: "animated",
	animations: {
		idle: {
			steps: [
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 } },
						{ texture: "shadow", anchor: { x: 12, y: 5 } }
					],
					duration: 40
				},
				{
					frames: [
						{ texture: "walk-%(dir)db", anchor: { x: 12, y: 15 } },
						{ texture: "shadow", anchor: { x: 12, y: 5 } }
					],
					duration: 8
				},
				{
					frames: [
						{ texture: "walk-%(dir)dc", anchor: { x: 12, y: 15 } },
						{ texture: "shadow", anchor: { x: 12, y: 5 } }
					],
					duration: 8
				}
			]
		},
		walk: {
			steps: [
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 } },
						{ texture: "shadow", anchor: { x: 12, y: 5 } }
					],
					duration: 3
				},
				{
					frames: [
						{ texture: "walk-%(dir)db", anchor: { x: 12, y: 15 } },
						{ texture: "shadow", anchor: { x: 12, y: 5 } }
					],
					duration: 6
				},
				{
					frames: [
						{ texture: "walk-%(dir)dc", anchor: { x: 12, y: 15 } },
						{ texture: "shadow", anchor: { x: 12, y: 5 } }
					],
					duration: 6
				}
			]
		},
		hurt: {
			steps: [
				{
					frames: [
						{ texture: "hurt-%(dir)d", anchor: { x: 12, y: 15 }, offset: 0 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0 }
					],
					duration: 1000
				}
			]
		},
		defeat: {
			steps: [
				{
					frames: [
						{ texture: "hurt-%(dir)d", anchor: { x: 12, y: 15 }, offset: 0 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: 0 }
					],
					duration: 10
				},
				{
					frames: [],
					duration: 10
				}
			]
		},
		tackle: {
			steps: [
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .04 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .04 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .08 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .08 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .12 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .12 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .16 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .16 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .20 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .20 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .24 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .24 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .20 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .20 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .16 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .16 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .12 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .12 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .08 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .08 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 }, offset: .04 },
						{ texture: "shadow", anchor: { x: 12, y: 5 }, offset: .04 }
					],
					duration: 1
				},
			]
		}
	},
	default: "idle"
};

let eeveeGraphics: EntityGraphics = {
	base: "eevee",
	useReflection: true,
	type: "animated",
	animations: {
		idle: {
			steps: [
				{
					frames: [
						{ texture: "idle-%(dir)da", anchor: { x: 16, y: 20 } },
						{ texture: "shadow", anchor: { x: 16, y: 18 } }
					],
					duration: 40
				},
				{
					frames: [
						{ texture: "idle-%(dir)db", anchor: { x: 16, y: 20 } },
						{ texture: "shadow", anchor: { x: 16, y: 18 } }
					],
					duration: 40
				}
			]
		},
		walk: {
			steps: [
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 } },
						{ texture: "shadow", anchor: { x: 16, y: 18 } }
					],
					duration: 3
				},
				{
					frames: [
						{ texture: "walk-%(dir)db", anchor: { x: 16, y: 20 } },
						{ texture: "shadow", anchor: { x: 16, y: 18 } }
					],
					duration: 6
				},
				{
					frames: [
						{ texture: "walk-%(dir)dc", anchor: { x: 16, y: 20 } },
						{ texture: "shadow", anchor: { x: 16, y: 18 } }
					],
					duration: 6
				}
			]
		},
		hurt: {
			steps: [
				{
					frames: [
						{ texture: "hurt-%(dir)d", anchor: { x: 16, y: 20 }, offset: 0 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: 0 }
					],
					duration: 1000
				}
			]
		},
		defeat: {
			steps: [
				{
					frames: [
						{ texture: "hurt-%(dir)d", anchor: { x: 16, y: 20 }, offset: 0 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: 0 }
					],
					duration: 10
				},
				{
					frames: [],
					duration: 10
				}
			]
		},
		tackle: {
			steps: [
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .04 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .04 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .08 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .08 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .12 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .12 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .16 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .16 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .20 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .20 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .24 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .24 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .20 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .20 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .16 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .16 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .12 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .12 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .08 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .08 }
					],
					duration: 1
				},
				{
					frames: [
						{ texture: "walk-%(dir)da", anchor: { x: 16, y: 20 }, offset: .04 },
						{ texture: "shadow", anchor: { x: 16, y: 18 }, offset: .04 }
					],
					duration: 1
				},
			]
		}
	},
	default: "idle"
};

eeveeGraphics.animations["growl"] = eeveeGraphics.animations["tackle"];
eeveeGraphics.animations["tail-whip"] = eeveeGraphics.animations["tackle"];
eeveeGraphics.animations["swift"] = eeveeGraphics.animations["tackle"];

export const graphics: EntityGraphicsCache = new Map([
	["mudkip", mudkipGraphics],
	["eevee", eeveeGraphics]
]);