import { generate as shortid } from "shortid";

let mudkip: OverworldEntity = {
	id: shortid(),
	name: "Mudkip",
	graphics: "mudkip",
	position: { x: 0, y: 0 },
	stats: {
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
		},
		belly: {
			max: 600,
			current: 600
		}
	},
	attacks: [],
	items: {
		held: { capacity: 0, items: [] }
	},
	*interact() {
		yield {
			speaker: "Mudkip",
			portrait: "mudkip-neutral",
			text: "It gets kind of boring just hanging around here..."
		};

		let selection = yield {
			speaker: "Mudkip",
			portrait: "mudkip-neutral",
			text: "Do you want to go into the dungeon?",
			responses: [ "Absolutely!", "No thanks." ]
		};

		if (selection == 0) {
			// start crawl
		} else {
			yield {
				speaker: "Mudkip",
				portrait: "mudkip-neutral",
				text: "Alright, suit yourself."
			}
		}
	}
};