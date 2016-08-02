interface State {
	story: Story.StoryState;
	crawl: Crawl.CrawlState;
}

interface Entity {
	name: string;
	graphics: string;
	stats: EntityStats;
	attacks: Attack[];
	items: {
		held: Items.ItemSet;
		bag?: Items.ItemSet;
	};
}

interface Attack {
	name: string;
	animation: string;
	description: string;
	target: TargetSelector;
	accuracy: number | "always";
	power?: number;
	uses: MaxCurrentStat;
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

declare namespace Story {
	type StoryState = void;
}

declare namespace Graphics {
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

	type EntityGrpahicsCache = Map<string, EntityGraphics>;

	interface EntityGraphics {
		base: string;
		useReflection?: boolean;
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
		offset?: number;
	}

	interface Point {
		x: number;
		y: number;
	}
}

declare namespace Items {
	interface Item {
	name: string;
	description: string;
	equip?(entity: Crawl.UnplacedCrawlEntity): Crawl.CrawlEntity; // In reality, Proxy<Crawl.CrawlEntity>
	[event: number]: (entity: Crawl.CrawlEntity, state: Crawl.InProgressCrawlState, held: boolean) => void;
		// In reality, index is Items.Hooks
	// graphics: Graphics.EntityGraphics;
	}

	interface ItemSet {
		capacity: number;
		items: Item[];
	}

	const enum Hooks {
		ENTITY_DEFEAT
	}
}

declare namespace Crawl {
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

	type CrawlItem = Items.Item & Locatable;

	interface Map {
		width: number;
		height: number;
		grid: DungeonTile[][];
	}

	interface DungeonTile {
		type: DungeonTileType;
		roomId?: number;
		stairs?: boolean;
	}

	const enum DungeonTileType {
		UNKNOWN,
		FLOOR,
		WALL
	}

	interface Location {
		r: number;
		c: number;
	}

	interface Locatable {
		location: Location;
	}

	interface UnplacedCrawlEntity extends Entity {
		id: string;
		controller: Controller;
		alignment: number;
		advances: boolean;
	}

	interface CrawlEntity extends UnplacedCrawlEntity, Locatable {
		map: Map;
	}

	interface CondensedEntity {
		id: string;
		name: string;
		graphics: string;
	}

	interface Controller {
		await: boolean;
		getAction(state: CensoredEntityCrawlState, entity: CrawlEntity): Promise<Action>;
		updateState(state: CensoredEntityCrawlState): void;
		pushEvent(event: LogEvent): void;
		wait(): void;
		init(entity: UnplacedCrawlEntity, dungeon: Crawl.CensoredDungeon): void;
	}

	type LogEvent = WaitLogEvent | MoveLogEvent | AttackLogEvent | StatLogEvent | DefeatLogEvent | StairsLogEvent
		| StartLogEvent | MissLogEvent | MessageLogEvent;

	interface WaitLogEvent {
		type: "wait";
		entity: CondensedEntity;
		location: Location;
	}

	interface MoveLogEvent {
		type: "move";
		entity: CondensedEntity;
		start: Location;
		end: Location;
		direction: number;
	}

	interface AttackLogEvent {
		type: "attack";
		entity: CondensedEntity;
		location: Location;
		attack: Attack;
		direction: number;
	}

	interface StatLogEvent {
		type: "stat";
		entity: CondensedEntity;
		location: Location;
		stat: string;
		change: number;
	}

	interface DefeatLogEvent {
		type: "defeat";
		entity: CondensedEntity;
	}

	interface StairsLogEvent {
		type: "stairs";
		entity: CondensedEntity;
	}

	interface StartLogEvent {
		type: "start";
		entity: CondensedEntity;
		floorInformation: {
			number: number;
			width: number;
			height: number;
		};
		self: CensoredSelfCrawlEntity;
	}

	interface MissLogEvent {
		type: "miss";
		entity: CondensedEntity;
		location: Location;
	}

	interface MessageLogEvent {
		type: "message";
		entity: CondensedEntity;
		message: string;
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
		enemies: EntityBlueprint[];
	}

	interface EntityBlueprint {
		density: number;
		name: string;
		graphics: string;
		stats: EntityStats;
		attacks: AttackBlueprint[];
	}

	interface AttackBlueprint {
		weight: number;
		attack: Attack;
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

	type Action = WaitAction | MoveAction | AttackAction | ItemAction | StairsAction; // TODO

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

	interface StairsAction {
		type: "stairs";
	}

	interface CensoredInProgressCrawlState {
		dungeon: CensoredDungeon;
		floor: Floor;
		entities: (CensoredCrawlEntity | CensoredSelfCrawlEntity)[];
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
		graphics: string;
		id: string;
		alignment: number;
		advances: boolean;
	}

	interface CensoredSelfCrawlEntity extends Locatable {
		name: string;
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
		map: Map;
	}
}
