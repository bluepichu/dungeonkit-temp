"use strict";

export function getAction(state: Game.Crawl.CensoredEntityCrawlState,
                          entity: Game.Crawl.CrawlEntity): Game.Crawl.Action {
	return { type: "wait" };
}