import { generate as shortid } from "shortid";

import { mudkipStats }         from "./stats";

let lonelyKip: OverworldEntity = {
	id: shortid(),
	name: "Mudkip",
	graphics: "mudkip",
	position: { x: 200, y: 200 },
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
			text: "Anyway... would you like to visit a dungeon?",
			responses: ["How about Treacherous Trench?", "I'm thinking Undersea Cavern.", "Could you take me to Calm Coral Reef?", "No thanks."]
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
		} else if (selection === 1) {
			yield {
				type: "speak",
				speaker: "Mudkip",
				portrait: "portrait-mudkip-happy",
				text: "Sounds good.  Have fun in there!"
			};

			return {
				type: "crawl",
				dungeon: "cavern"
			};
		} else if (selection === 2) {
			yield {
				type: "speak",
				speaker: "Mudkip",
				portrait: "portrait-mudkip-happy",
				text: "No problem.  Enjoy your exploration!"
			};

			return {
				type: "crawl",
				dungeon: "coral-reef"
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
	position: { x: 250, y: 200 },
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

export let scene: OverworldScene = {
	background: [
		{ graphics: "ocean", position: { x: 0, y: 0 }}
	],
	bounds: { x: { min: 0, max: 480 }, y: { min: 0, max: 336 } },
	obstacles: [],
	hotzones: [
		{
			id: "to-trench",
			area: [ { x: 460, y: 316 }, { x: 480, y: 316 }, { x: 480, y: 336 }, { x: 460, y: 336 } ],
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
		}
	],
	entities: [lonelyKip, angryKip]
};

export let alphaScene: OverworldScene = Object.assign({}, scene);
alphaScene.hotzones = alphaScene.hotzones.map((x) => x);
alphaScene.hotzones.push({
	id: "to-special",
	area: [ { x: 0, y: 20 }, { x: 20, y: 20 }, { x: 20, y: 0 }, { x: 0, y: 0 } ],
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