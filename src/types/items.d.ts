interface ItemBlueprint {
	name: string;
	description: string;
	equip?(entity: UnplacedCrawlEntity): UnplacedCrawlEntity; // via a proxy
	handlers: {
		[event: number]: (entity: CrawlEntity, state: InProgressCrawlState, Item: Item, held: boolean, eventLog: LogEvent[]) => void
			// In reality, index is ItemHook
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