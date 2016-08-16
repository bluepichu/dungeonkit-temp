declare namespace Client {
	interface UpdateMessage {
		stateUpdate: StateUpdate;
		log: Crawl.LogEvent[];
		move: boolean;
	}

	interface StateUpdate {
		floor: FloorUpdate;
		entities: (Crawl.CensoredCrawlEntity | Crawl.CensoredSelfCrawlEntity)[];
		items: Crawl.CrawlItem[];
		self: CensoredSelfEntity;
	}

	interface CensoredSelfEntity {
		name: string;
		location: Crawl.Location;
		graphics: string;
		id: string;
		attacks: Attack[];
		stats: EntityStats;
		alignment: number;
		advances: boolean;
		items: {
			held: ItemSet;
			bag?: ItemSet;
		};
	}

	interface FloorUpdate {
		number: number;
		mapUpdates: MapUpdate[];
	}

	interface MapUpdate {
		location: Crawl.Location;
		tile: Crawl.DungeonTile;
	}

	interface ActionOptions {
		dash?: boolean;
	}

	interface CensoredClientCrawlState {
		dungeon: Crawl.CensoredDungeon;
		floor: Crawl.Floor;
		entities: Crawl.CensoredCrawlEntity[];
		items: Crawl.CrawlItem[];
		self: CensoredSelfEntity;
	}
}