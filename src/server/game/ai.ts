"use strict";

export function getAction(state: Game.Crawl.InProgressCrawlState, entity: Game.Crawl.CrawlEntity): Game.Crawl.Action {
	return { type: "wait" };
}