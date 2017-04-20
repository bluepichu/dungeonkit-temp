"use strict";

import * as clone       from "clone";
import * as shortid     from "shortid";
import { eeveeStats }   from "./stats";

import {
	tackle,
	growl,
	tailWhip,
	swift
} from "./attacks";

export function generatePlayer(name: string = "Eevee"): PlayerOverworldEntity {
	return {
		id: shortid.generate(),
		name: name,
		stats: clone(eeveeStats),
		attacks: clone([tackle, growl, tailWhip, swift]),
		items: {
			held: { capacity: 1, items: [] },
			bag: { capacity: 12, items: [] }
		},
		graphics: "eevee",
		position: { x: 60, y: 323 },
		direction: 1,
		attributes: [],
		salt: 0
	};
}