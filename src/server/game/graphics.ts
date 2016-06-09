"use strict";

let mudkipGraphics: Game.Graphics.EntityGraphics = {
	base: "mudkip",
	object: {
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
						duration: 4
					},
					{
						frames: [
							{ texture: "walk-%(dir)db", anchor: { x: 12, y: 15 } },
							{ texture: "shadow", anchor: { x: 12, y: 5 } }
						],
						duration: 4
					},
					{
						frames: [
							{ texture: "walk-%(dir)dc", anchor: { x: 12, y: 15 } },
							{ texture: "shadow", anchor: { x: 12, y: 5 } }
						],
						duration: 4
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
	}
};

export const graphics: Game.Graphics.EntityGrpahicsCache = new Map([
	["mudkip", mudkipGraphics]
]);