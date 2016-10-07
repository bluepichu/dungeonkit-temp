"use strict";

import * as log       from "beautiful-log";
import {AIController} from "./controllers";
import * as utils     from "../../common/utils";

export function getAction(state: CensoredEntityCrawlState,
                          entity: CrawlEntity,
                          controller: AIController): Action {
	log.logf("<blue>AI %s is moving!</blue>", entity.id);

	// Update our attack target if needed
	let attackTarget: CensoredCrawlEntity = undefined;

	if (!utils.isVoid(controller.attackTarget)) {
		state.entities.forEach((ent) => {
			if (ent.id === controller.attackTarget.id) {
				attackTarget = ent;
			}
		});
	}

	if (utils.isVoid(attackTarget)) {
		attackTarget =
			state.entities.filter((ent) => ent.alignment !== entity.alignment)
				.reduce((best, current) =>
					utils.isVoid(best)
					|| utils.distance(entity.location, current.location) < utils.distance(entity.location, best.location)
						? current
						: best,
				undefined);
	}

	controller.attackTarget = attackTarget;

	if (!utils.isVoid(controller.attackTarget)) {
		// Set our move target in case the target flees
		controller.moveTarget = controller.attackTarget.location;

		// If you're next to the attack target, attack them
		if (utils.distance(entity.location, controller.attackTarget.location) === 1) {
			return {
				type: "attack",
				attack: {
					name: "Tackle",
					animation: "tackle",
					description: "Charges the foe with a full-body tackle.",
					target: { type: "front", includeAllies: false },
					uses: { max: 30, current: 30 },
					accuracy: 95,
					power: 7,
					onHit: []
				},
				direction: directionTo(entity.location, controller.attackTarget.location)
			};
		}
	}

	// Clear the move target if we've already reached it
	if (!utils.isVoid(controller.moveTarget) && utils.areCrawlLocationsEqual(entity.location, controller.moveTarget)) {
		controller.moveTarget = undefined;
	}

	if (!utils.isVoid(controller.moveTarget)) {
		// Move towards the move target
		return {
			type: "move",
			direction: directionTo(entity.location, controller.moveTarget)
		};
	}

	// not sure how to pick a new move target yet...
	return { type: "move", direction: Math.floor(Math.random() * 8) };
}

function directionTo(from: CrawlLocation, to: CrawlLocation): number {
	if (from.r < to.r) {
		if (from.c < to.c) {
			return 7;
		} else if (from.c > to.c) {
			return 5;
		} else {
			return 6;
		}
	} else if (from.r > to.r) {
		if (from.c < to.c) {
			return 1;
		} else if (from.c > to.c) {
			return 3;
		} else {
			return 2;
		}
	} else {
		if (from.c > to.c) {
			return 4;
		} else {
			return 0;
		}
	}
}