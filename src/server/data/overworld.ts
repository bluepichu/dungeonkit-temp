import { generate as shortid } from "shortid";

import { blenderStats }        from "./stats";

let lonelyKip: OverworldEntity = {
	id: shortid(),
	name: "Blender",
	graphics: "blender",
	position: { x: 200, y: 200 },
	direction: 7,
	stats: blenderStats,
	attacks: [],
	attributes: [],
	salt: 0,
	items: {
		held: { capacity: 0, items: [] }
	},
	*interact() {
		yield {
			type: "speak",
			speaker: "Blender",
			portrait: "portrait-mudkip-happy",
			text: "It's good to see you!"
		};

		yield {
			type: "speak",
			speaker: "Blender",
			portrait: "portrait-mudkip-sad",
			text: "It can get kind of lonely hanging around here all by myself sometimes..."
		};

		let selection = yield {
			type: "speak",
			speaker: "Blender",
			portrait: "portrait-mudkip-neutral",
			text: "Anyway... would you like to visit a dungeon?",
			responses: ["How about Treacherous Trench?", "I'm thinking Undersea Cavern.", "Could you take me to Calm Coral Reef?", "No thanks."]
		};

		if (selection === 0) {
			yield {
				type: "speak",
				speaker: "Blender",
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
				speaker: "Blender",
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
				speaker: "Blender",
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
				speaker: "Blender",
				portrait: "portrait-mudkip-neutral",
				text: "Ok, but don't hesitate to come back if you change your mind!"
			};
		}
	}
};

let angryKip: OverworldEntity = {
	id: shortid(),
	name: "Blender",
	graphics: "blender",
	position: { x: 250, y: 200 },
	direction: 5,
	stats: blenderStats,
	attacks: [],
	attributes: [],
	salt: 0,
	items: {
		held: { capacity: 0, items: [] }
	},
	*interact() {
		yield {
			type: "speak",
			speaker: "Blender",
			portrait: "portrait-mudkip-angry",
			text: "Did that other guy say something to you about being lonely?"
		};

		return {
			type: "speak",
			speaker: "Blender",
			portrait: "portrait-mudkip-sad",
			text: "He does realize I'm right here, right?"
		};
	}
};

export let scene: OverworldScene = {
	background: [
		{ graphics: "ocean", position: { x: 0, y: 0 }}
	],
	bounds: { x: { min: 20, max: 460 }, y: { min: 20, max: 316 } },
	obstacles: [
		[ { x: 210, y: 246 }, { x: 168, y: 200 }, { x: 168, y: 143 }, { x: 212, y: 100 }, { x: 268, y: 100 }, { x: 312, y: 143 }, { x: 312, y: 200 }, { x: 270, y: 246 } ],
		[ { x: 0, y: 220 }, { x: 94, y: 250 }, { x: 188, y: 336 }, { x: 0, y: 336 } ],
		[ { x: 480, y: 220 }, { x: 386, y: 250 }, { x: 292, y: 336 }, { x: 480, y: 336 } ],
		[ { x: 0, y: 182 },  { x: 150, y: 133 }, { x: 225, y: 70 }, { x: 225, y: 0 }, { x: 0, y: 0 } ],
		[ { x: 480, y: 182 },  { x: 330, y: 133 }, { x: 255, y: 70 }, { x: 255, y: 0 }, { x: 480, y: 0 } ]
	],
	hotzones: [
		{
			id: "to-coral-reef",
			area: [ { x: 0, y: 182 }, { x: 40, y: 182 }, { x: 40, y: 220 }, { x: 0, y: 220 } ],
			*interact() {
				let selection = yield {
					type: "speak",
					text: "Would you like to enter Calm Coral Reef?",
					responses: [ "Yes", "No" ]
				};

				if (selection === 0) {
					return {
						type: "crawl",
						dungeon: "coral-reef"
					};
				}
			}
		},
		{
			id: "to-cavern",
			area: [ { x: 480, y: 182 }, { x: 440, y: 182 }, { x: 440, y: 220 }, { x: 480, y: 220 } ],
			*interact() {
				let selection = yield {
					type: "speak",
					text: "Would you like to enter Undersea Cavern?",
					responses: [ "Yes", "No" ]
				};

				if (selection === 0) {
					return {
						type: "crawl",
						dungeon: "cavern"
					};
				}
			}
		},
		{
			id: "to-trench",
			area: [ { x: 225, y: 0 }, { x: 255, y: 0 }, { x: 255, y: 40 }, { x: 225, y: 40 } ],
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