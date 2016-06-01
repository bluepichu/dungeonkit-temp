"use strict";

import * as log from "beautiful-log";

export function getAction(state: Game.Crawl.CensoredEntityCrawlState,
                          entity: Game.Crawl.CrawlEntity): Game.Crawl.Action {
	log.logf("<blue>AI %s is moving!</blue>", entity.id);
	return { type: "move", direction: Math.floor(Math.random() * 8) };
}