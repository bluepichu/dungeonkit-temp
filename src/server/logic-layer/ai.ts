"use strict";

import * as utils     from "../../common/utils";

const log = require("beautiful-log")("dungeonkit:ai");

/**
 * Selects which action should be taken in the given state by the given AI entity.
 * @param state - The current state.
 * @param entity - The entity for which to select a action.
 * @return The selected action.
 */
export function getAction(state: CensoredEntityCrawlState, entity: CrawlEntity): Action {
	log(`Computing move for ${entity.id}`);

	log("Done computing move - going in a random direction");
	return { type: "move", direction: Math.floor(Math.random() * 8) };
}