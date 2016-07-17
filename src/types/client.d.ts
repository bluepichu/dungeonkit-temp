declare namespace Game {
	namespace Client {
		interface UpdateMessage {
			stateUpdate: StateUpdate;
			log: Game.Crawl.LogEvent[];
			move: boolean;
		}

		interface StateUpdate {
			floor: FloorUpdate;
			entities: Game.Crawl.CensoredCrawlEntity[];
			self: CensoredSelfEntity;
		}

		interface CensoredSelfEntity {
			name: string;
			location: Game.Crawl.Location;
			graphics: string;
			id: string;
			attacks: Attack[];
			stats: EntityStats;
			alignment: number;
			advances: boolean;
			items: {
				held: ItemSet;
				bag: ItemSet;
			};
		}

		interface FloorUpdate {
			number: number;
			mapUpdates: MapUpdate[];
			items: Game.Crawl.CrawlItem[];
		}

		interface MapUpdate {
			location: Game.Crawl.Location;
			tile: Game.Crawl.DungeonTile;
		}

		interface ActionOptions {
			dash?: boolean;
		}

		interface CensoredClientCrawlState {
			dungeon: Game.Crawl.CensoredDungeon;
			floor: Game.Crawl.Floor;
			entities: Game.Crawl.CensoredCrawlEntity[];
			self: CensoredSelfEntity;
		}
	}
}