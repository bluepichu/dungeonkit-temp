declare namespace Game {
	interface State {
		story: Story.StoryState;
		crawl: Crawl.CrawlState;
	}

	interface Entity {
		name: string;
		graphics: Graphics.EntityGraphics;
		stats: EntityStats;
		attacks: Attack[];
	}

	interface Item {
		name: string;
		description: string;
		graphics: Graphics.EntityGraphics;
	}

	interface Attack {
		name: string;
		description: string;
		target: TargetSelector;
		accuracy: number | "always";
		power: number;
		onHit: SecondaryEffect[];
		// onMiss
	}

	type TargetSelector = RoomTargetSelector | FrontTargetSelector | SelfTargetSelector | TeamTargetSelector;

	interface RoomTargetSelector {
		type: "room";
		includeSelf: boolean;
		includeAllies: boolean;
	}

	interface FrontTargetSelector {
		type: "front";
		includeAllies: boolean;
	}

	interface SelfTargetSelector {
		type: "self";
	}

	interface TeamTargetSelector {
		type: "team";
		includeSelf: boolean;
	}

	type SecondaryEffect = SecondaryStatEffect;

	interface SecondaryStatEffect {
		type: "stat";
		stat: string;
		amount: number;
	}

	interface EntityStats {
		level: number;
		hp: MaxCurrentStat;
		attack: BaseModifierStat;
		defense: BaseModifierStat;
	}

	interface MaxCurrentStat {
		max: number;
		current: number;
	}

	interface BaseModifierStat {
		base: number;
		modifier: number;
	}

	namespace Story {
		type StoryState = void;
	}

	namespace Graphics {
		interface DungeonGraphics {
			base: string;
			walls: DungeonTileSelector[];
			open: GraphicsObject;
			stairs: GraphicsObject;
		}

		interface DungeonTileSelector {
			pattern: number;
			object: GraphicsObject;
		}

		type GraphicsObject = AnimatedGraphicsObject | StaticGraphicsObject;

		interface EntityGraphics {
			base: string;
			object: AnimatedGraphicsObject;
		}

		interface StaticGraphicsObject {
			type: "static";
			frames: Frame[];
		}

		interface AnimatedGraphicsObject {
			type: "animated";
			animations: { [key: string]: Animation };
			default: string;
		}

		interface Animation {
			steps: AnimationFrame[];
		}

		interface AnimationFrame {
			frames: Frame[];
			duration: number;
		}

		interface Frame {
			texture: string;
			anchor: Point;
		}

		interface Point {
			x: number;
			y: number;
		}
	}

	namespace Crawl {
		type CrawlState = InProgressCrawlState | ConcludedCrawlState;

		interface InProgressCrawlState {
			dungeon: Dungeon;
			floor: Floor;
			entities: CrawlEntity[];
		}

		interface ConcludedCrawlState {
			dungeon: Dungeon;
			success: boolean;
			floor: number;
		}

		interface Dungeon {
			name: string;
			floors: number;
			direction: "up" | "down";
			difficulty: number;
			blueprint: DungeonBlueprint;
			graphics: Graphics.DungeonGraphics;
		}

		interface Floor {
			number: number;
			map: Map;
			items: CrawlItem[];
		}

		interface CrawlItem extends Item, Locatable {}

		interface Map {
			width: number;
			height: number;
			grid: DungeonTile[][];
		}

		interface DungeonTile {
			type: DungeonTileType;
			roomId: number;
			stairs: boolean;
		}

		type DungeonTileType = "open" | "wall" | "unknown";

		interface Location {
			r: number;
			c: number;
		}

		interface Locatable {
			location: Location;
		}

		interface UnplacedCrawlEntity extends Entity {
			id: string;
			bag: Bag;
			controller: Controller;
			alignment: number;
			advances: boolean;
		}

		interface CrawlEntity extends UnplacedCrawlEntity, Locatable {
			map: Map;
		}

		interface Bag {
			capacity: number;
			items: Item[];
		}

		interface Controller {
			getAction(state: CensoredEntityCrawlState, entity: CrawlEntity): Promise<Action>;
			updateState(state: CensoredEntityCrawlState): void;
			pushEvent(event: LogEvent): void;
			wait(): void;
			init(entity: UnplacedCrawlEntity): void;
		}

		interface CrawlItem extends Item, Locatable { }

		type LogEvent = WaitLogEvent | MoveLogEvent | AttackLogEvent | StatLogEvent;

		interface WaitLogEvent {
			type: "wait";
			entity: {
				id: string;
				name: string;
			};
			location: Location;
		}

		interface MoveLogEvent {
			type: "move";
			entity: {
				id: string;
				name: string
			};
			start: Location;
			end: Location;
			direction: number;
		}

		interface AttackLogEvent {
			type: "attack";
			entity: {
				id: string;
				name: string;
			};
			location: Location;
			attack: Attack;
			direction: number;
		}

		interface StatLogEvent {
			type: "stat";
			entity: {
				id: string;
				name: string;
			};
			location: Location;
			stat: string;
			change: number;
		}

		interface SynchronizedMessage<T> {
			id: string;
			last?: string;
			message: T;
		}

		type DungeonBlueprint = FloorRangeBlueprint[];

		interface FloorRangeBlueprint {
			range: [number, number];
			blueprint: FloorBlueprint;
		}

		interface FloorBlueprint {
			generatorOptions: GeneratorOptionsWrapper;
			enemies: Entity[];
		}

		type GeneratorOptionsWrapper = DFSGeneratorOptionsWrapper | FeatureGeneratorOptionsWrapper;

		interface DFSGeneratorOptionsWrapper {
			generator: "dfs";
			options: DFSGeneratorOptions;
		}

		interface DFSGeneratorOptions {
			size: {
				width: number;
				height: number;
			};
			spacing: number;
			rooms: {
				density: number;
				width: {
					min: number;
					max: number;
				};
				height: {
					min: number;
					max: number;
				};
				gutter: number;
			};
			corridors: {
				remove: number;
				straightness: number;
			};
			connectors: {
				randomness: number;
			};
		}

		interface FeatureGeneratorOptionsWrapper {
			generator: "feature";
			options: FeatureGeneratorOptions;
		}

		interface FeatureGeneratorOptions {
			width: {
				min: number;
				max: number;
			};
			height: {
				min: number;
				max: number;
			};
			features: {
				rooms: Feature[];
				corridors: Feature[];
			};
			limit: number;
			cleanliness: number;
		}

		interface Feature {
			width: number;
			height: number;
			weight: number;
			grid: string[];
		}

		type Action = WaitAction | MoveAction | AttackAction | ItemAction; // TODO

		interface WaitAction {
			type: "wait";
		}

		interface MoveAction {
			type: "move";
			direction: number;
		}

		interface AttackAction {
			type: "attack";
			direction: number;
			attack: Attack;
		}

		interface ItemAction {
			type: "item";
			// some other stuff...
		}

		interface ClientActionOptions {
			dash?: boolean;
		}

		interface CensoredInProgressCrawlState {
			dungeon: CensoredDungeon;
			floor: Floor;
			entities: CensoredCrawlEntity[];
		}

		interface CensoredEntityCrawlState extends CensoredInProgressCrawlState {
			self: CensoredSelfCrawlEntity;
		}

		interface CensoredDungeon {
			name: string;
			floors: number;
			direction: "up" | "down";
			difficulty: number;
			graphics: Graphics.DungeonGraphics;
		}

		interface CensoredCrawlEntity extends Locatable {
			name: string;
			graphics: Graphics.EntityGraphics;
			id: string;
			alignment: number;
			advances: boolean;
		}

		interface CensoredSelfCrawlEntity extends Locatable {
			name: string;
			graphics: Graphics.EntityGraphics;
			id: string;
			alignment: number;
			advances: boolean;
			bag: Bag;
			map: Map;
		}

		interface ClientUpdate {
			state: CensoredEntityCrawlState;
			log: LogEvent[];
			move: boolean;
		}
	}
}
