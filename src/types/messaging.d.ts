interface WrappedInMessage {
	socketId: string;
	message: InMessage;
}

type InMessage = StartCrawlInMessage | CrawlActionInMessage;

interface StartCrawlInMessage {
	type: "crawl-start";
	dungeon: string;
	entity: UnplacedCrawlEntity;
}

interface CrawlActionInMessage {
	type: "crawl-action";
	action: Action;
	options: ActionOptions;
}




interface WrappedOutMessage {
	socketId: string;
	message: OutMessage;
}

type OutMessage = GetActionOutMessage | InvalidActionOutMessage;

interface GetActionOutMessage {
	type: "crawl-get-action";
	update: UpdateMessage;
}

interface InvalidActionOutMessage {
	type: "crawl-action-invalid";
}