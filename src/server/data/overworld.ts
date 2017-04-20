import { generate as shortid } from "shortid";

import { mudkipStats }         from "./stats";

let lonelyKip: OverworldEntity = {
	id: shortid(),
	name: "Mudkip",
	graphics: "mudkip",
	position: { x: 461, y: 275 },
	direction: 7,
	stats: mudkipStats,
	attacks: [],
	attributes: [],
	salt: 0,
	items: {
		held: { capacity: 0, items: [] }
	},
	*interact() {
		yield {
			type: "speak",
			speaker: "Mudkip",
			portrait: "portrait-mudkip-happy",
			text: "It's good to see you!"
		};

		yield {
			type: "speak",
			speaker: "Mudkip",
			portrait: "portrait-mudkip-sad",
			text: "It can get kind of lonely hanging around here all by myself sometimes..."
		};

		let selection = yield {
			type: "speak",
			speaker: "Mudkip",
			portrait: "portrait-mudkip-neutral",
			text: "Anyway... would you like to go to Treacherous Trench?",
			responses: ["Sure!", "No thanks."]
		};

		if (selection === 0) {
			yield {
				type: "speak",
				speaker: "Mudkip",
				portrait: "portrait-mudkip-happy",
				text: "Great!  I'll warp you there."
			};

			return {
				type: "crawl",
				dungeon: "trench"
			};
		} else {
			return {
				type: "speak",
				speaker: "Mudkip",
				portrait: "portrait-mudkip-neutral",
				text: "Ok, but don't hesitate to come back if you change your mind!"
			};
		}
	}
};

let angryKip: OverworldEntity = {
	id: shortid(),
	name: "Mudkip",
	graphics: "mudkip",
	position: { x: 573, y: 281 },
	direction: 5,
	stats: mudkipStats,
	attacks: [],
	attributes: [],
	salt: 0,
	items: {
		held: { capacity: 0, items: [] }
	},
	*interact() {
		yield {
			type: "speak",
			speaker: "Mudkip",
			portrait: "portrait-mudkip-angry",
			text: "Did that other guy say something to you about being lonely?"
		};

		return {
			type: "speak",
			speaker: "Mudkip",
			portrait: "portrait-mudkip-sad",
			text: "He does realize I'm right here, right?"
		};
	}
};

let sc: OverworldScene;

let pond: OverworldScene = {
	background: [
		{ graphics: "pond", position: { x: 0, y: 0 }},
	],
	bounds: { x: { min: 0, max: 460 }, y: { min: 0, max: 530 } },
	obstacles: [],
	hotzones: [
		{
			id: "to-pond",
			area: [ { x: 194, y: 507 }, { x: 194, y: 536 }, { x: 266, y: 536 }, { x: 266, y: 507 } ],
			*interact(): IterableIterator<Interaction> {
				return {
					type: "transition",
					scene: sc,
					start: {
						position: { x: 516, y: 37 },
						direction: 6
					}
				};
			}
		}
	],
	entities: []
};

export let scene: OverworldScene = {
	background: [
		{ graphics: "pkmn-square", position: { x: 0, y: 0 }}
	],
	bounds: { x: { min: 0, max: 958 }, y: { min: 0, max: 719 } },
	obstacles: [],
	hotzones: [
		{
			id: "to-proto-forest",
			area: [ { x: 926, y: 307 }, { x: 958, y: 307 }, { x: 958, y: 339 }, { x: 926, y: 339 } ],
			*interact() {
				let selection = yield {
					type: "speak",
					text: "Would you like to enter Treacherous Trench?",
					responses: [ "Yes", "No" ]
				};

				if (selection === 0) {
					return {
						type: "crawl",
						dungeon: "trench"
					};
				}
			}
		},
		{
			id: "to-pond",
			area: [ { x: 478, y: 0 }, { x: 553, y: 0 }, { x: 553, y: 32 }, { x: 478, y: 32 }],
			*interact(): IterableIterator<Interaction> {
				return {
					type: "transition",
					scene: pond,
					start: {
						position: { x: 230, y: 500 },
						direction: 2
					}
				};
			}
		}
	],
	entities: [lonelyKip, angryKip]
};

sc = scene;

export let alphaScene: OverworldScene = Object.assign({}, scene);
alphaScene.hotzones = alphaScene.hotzones.map((x) => x);
alphaScene.hotzones.push({
	id: "to-special",
	area: [ { x: 926, y: 407 }, { x: 958, y: 407 }, { x: 958, y: 439 }, { x: 926, y: 439 } ],
	*interact() {
		let selection = yield {
			type: "speak",
			text: "Would you like to enter Shallow Sandbar?",
			responses: [ "Yes", "No" ]
		};

		if (selection === 0) {
			return {
				type: "crawl",
				dungeon: "sandbar"
			};
		}
	}
});