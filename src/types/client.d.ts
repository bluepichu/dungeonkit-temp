declare namespace Client {
	interface UpdateMessage {
		stateUpdate: StateUpdate;
		log: Crawl.LogEvent[];
		move: boolean;
	}

	interface StateUpdate {
		floor: FloorUpdate;
		entities: (Crawl.CensoredCrawlEntity | Crawl.CensoredSelfCrawlEntity)[];
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
			held: Items.ItemSet;
			bag?: Items.ItemSet;
		};
	}

	interface FloorUpdate {
		number: number;
		mapUpdates: MapUpdate[];
		items: Crawl.CrawlItem[];
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
		self: CensoredSelfEntity;
	}
}