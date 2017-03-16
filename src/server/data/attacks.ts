"use strict";

export let tackle: Attack = {
	name: "Tackle",
	animation: "tackle",
	description: "Charges the foe with a full-body tackle.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 30,
		current: 30
	},
	accuracy: 95,
	power: 7,
	onHit: []
};

export let growl: Attack = {
	name: "Growl",
	animation: "growl",
	description: "Growls cutely to reduce the foe's ATTACK.",
	target: {
		type: "room",
		includeAllies: false,
		includeSelf: false
	},
	uses: {
		max: 30,
		current: 30
	},
	accuracy: "always",
	onHit: [
		{
			type: "stat",
			stat: "attack",
			amount: -1
		}
	]
};

export let waterGun: Attack = {
	name: "Water Gun",
	animation: "water-gun",
	description: "Squirts water to attack the foe.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 30,
		current: 30
	},
	accuracy: 88,
	power: 5,
	onHit: []
};

export let tailWhip: Attack = {
	name: "Tail Whip",
	animation: "tail-whip",
	description: "Lowers the target's Defense by one level.",
	target: {
		type: "front",
		includeAllies: false
	},
	uses: {
		max: 20,
		current: 20
	},
	accuracy: 100,
	onHit: [
		{
			type: "stat",
			stat: "defense",
			amount: -1
		}
	]
};

export let swift: Attack = {
	name: "Swift",
	animation: "swift",
	description: "Inflicts damage on the target. It never misses.",
	target: {
		type: "front",
		includeAllies: false,
		cutsCorners: true
	},
	uses: {
		max: 8,
		current: 8
	},
	accuracy: "always",
	power: 10,
	onHit: []
};