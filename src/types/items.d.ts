interface ItemBlueprint {
	name: string;
	description: string;
	equip?(entity: UnplacedCrawlEntity): UnplacedCrawlEntity; // via a proxy
	handlers: {
		use?(entity: CrawlEntity, state: InProgressCrawlState, Item: Item, held: boolean, eventLog: LogEvent[]): void;
		throw?(): void;
		entityDefeat?(entity: CrawlEntity, state: InProgressCrawlState, Item: Item, held: boolean, eventLog: LogEvent[]): void;
	};
	actions?: {
		[action: string]: string[]; // In reality, index is ItemActionType
	};
	graphics: string;
}

interface Item extends ItemBlueprint {
	id: string;
}

interface ItemSet {
	capacity: number;
	items: Item[];
}

declare const enum ItemHook {
	ITEM_USE,
	ITEM_THROW,
	ENTITY_DEFEAT
}

type ItemActionType = "use" | "throw" | "drop" | "equip" | "unequip";