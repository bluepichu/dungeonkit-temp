"use strict";

import * as utils     from "../../common/utils";

const log = require("beautiful-log")("dungeonkit:ai");

export function getAction(state: CensoredEntityCrawlState, entity: CrawlEntity): Action {
	log(`Computing move for ${entity.id}`);

	log("Done computing move - going in a random direction");
	return { type: "move", direction: Math.floor(Math.random() * 8) };
}