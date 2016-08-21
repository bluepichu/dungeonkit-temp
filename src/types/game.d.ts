/**
 * The main state object for the entire game.
 */
interface State {
	story: Story.StoryState;
	crawl: Crawl.CrawlState;
}

/**
 * An entity, either in the overworld or in a crawl.
 */
interface Entity {
	name: string;
	graphics: string;
	stats: EntityStats;
	attacks: Attack[];
	items: {
		held: ItemSet;
		bag?: ItemSet;
	};
}

/**
 * An attack.
 */
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

/**
 * Describes the enemies targeted by an attack.
 */
type TargetSelector = RoomTargetSelector | FrontTargetSelector | SelfTargetSelector | TeamTargetSelector;

/**
 * A target selector that selects entities in the same room as the attacker.
 */
interface RoomTargetSelector {
	type: "room";
	includeSelf: boolean;
	includeAllies: boolean;
}

/**
 * A target selector that selects a target directly in front of the attacker.
 */
interface FrontTargetSelector {
	type: "front";
	includeAllies: boolean;
	cutsCorners?: boolean;
}

/**
 * A target selector that selects the attacker itself.
 */
interface SelfTargetSelector {
	type: "self";
}

/**
 * A target selector that selects members of the attacker's team.
 */
interface TeamTargetSelector {
	type: "team";
	includeSelf: boolean;
}

/**
 * Describes an effect other than damage caused by an attack.
 */
type SecondaryEffect = SecondaryStatEffect;

/**
 * A secondary effect that affects a stat.
 */
interface SecondaryStatEffect {
	type: "stat";
	stat: string;
	amount: number;
}

/**
 * Describes an entity's stats.
 */
interface EntityStats {
	level: number;
	hp: MaxCurrentStat;
	attack: BaseModifierStat;
	defense: BaseModifierStat;
}

/**
 * A stat consisting of a maximum value and a current value.
 */
interface MaxCurrentStat {
	max: number;
	current: number;
}

/**
 * A stat consisting of a base value and a modifier value.
 */
interface BaseModifierStat {
	base: number;
	modifier: number;
}

declare namespace Story {
	/**
	 * The story state.  TODO.
	 */
	type StoryState = void;
}

declare namespace Graphics {
	/**
	 * Describes the graphics for a dungeon.
	 */
	interface DungeonGraphics {
		base: string;
		walls: DungeonTileSelector[];
		open: GraphicsObject;
		stairs: GraphicsObject;
	}

	/**
	 * Describes the graphics for a dungeon tile given the wall pattern around it.
	 */
	interface DungeonTileSelector {
		pattern: number;
		object: GraphicsObject;
	}

	/**
	 * A graphics object.
	 */
	type GraphicsObject = AnimatedGraphicsObject | StaticGraphicsObject;

	/**
	 * The cache for entity graphics.
	 */
	type EntityGraphicsCache = Map<string, EntityGraphics>;

	/**
	 * Describes an entity's graphics.
	 */
	interface EntityGraphics extends AnimatedGraphicsObject {
		useReflection?: boolean;
	}

	/**
	 * Describes a non-animated graphics object.
	 */
	interface StaticGraphicsObject {
		type: "static";
		base?: string;
		frames: Frame[];
	}

	/**
	 * Describes an animated graphics object.
	 */
	interface AnimatedGraphicsObject {
		type: "animated";
		base?: string;
		animations: { [key: string]: Animation };
		default: string;
	}

	/**
	 * Describes an animation.
	 */
	interface Animation {
		steps: AnimationFrame[];
	}

	/**
	 * Describes a single frame of an animation.
	 */
	interface AnimationFrame {
		frames: Frame[];
		duration: number;
	}

	/**
	 * Describes a single frame.
	 */
	interface Frame {
		texture: string;
		anchor: Point;
		offset?: number;
	}

	/**
	 * A point in 2D space.
	 */
	interface Point {
		x: number;
		y: number;
	}
}

interface ItemBlueprint {
	name: string;
	description: string;
	equip?(entity: Crawl.UnplacedCrawlEntity): Crawl.UnplacedCrawlEntity; // via a proxy
	handlers: {
		[event: number]: (entity: Crawl.CrawlEntity, state: Crawl.InProgressCrawlState, Item: Item, held: boolean) => void
			// In reality, index is ItemHook
	};
	actions?: {
		[action: string]: string[]; // In reality, index is ItemActionType
	};
	graphics: Graphics.GraphicsObject;
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

type Distribution = BinomialDistribution;

interface BinomialDistribution {
	type: "binomial";
	n: number;
	p: number;
}

declare namespace Crawl {
	type CrawlState = InProgressCrawlState | ConcludedCrawlState;

	interface InProgressCrawlState {
		dungeon: Dungeon;
		floor: Floor;
		entities: CrawlEntity[];
		items: Crawl.CrawlItem[];
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
	}

	type CrawlItem = Item & Locatable;

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
		| StartLogEvent | MissLogEvent | MessageLogEvent | ItemPickupLogEvent | ItemDropLogEvent;

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

	interface ItemPickupLogEvent {
		type: "item_pickup";
		entity: CondensedEntity;
		item: Item;
	}

	interface ItemDropLogEvent {
		type: "item_drop";
		entity: CondensedEntity;
		item: Item;
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
		generatorOptions: GeneratorOptions;
		enemies: EntityBlueprint[];
		items: DungeonItemBlueprint[];
	}

	interface DungeonItemBlueprint {
		density: Distribution;
		item: ItemBlueprint;
	}

	interface EntityBlueprint {
		density: Distribution;
		name: string;
		graphics: string;
		stats: EntityStats;
		attacks: AttackBlueprint[];
	}

	interface AttackBlueprint {
		weight: number;
		attack: Attack;
	}

	interface GeneratorOptions {
		width: Distribution;
		height: Distribution;
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

	type Action = WaitAction | MoveAction | AttackAction | ItemAction | StairsAction;

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
		direction: number;
		action: ItemActionType;
		item: string;
	}

	interface StairsAction {
		type: "stairs";
	}

	interface CensoredInProgressCrawlState {
		dungeon: CensoredDungeon;
		floor: Floor;
		entities: (CensoredCrawlEntity | CensoredSelfCrawlEntity)[];
		items: CrawlItem[];
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
		stats: CensoredEntityStats;
	}

	interface CensoredEntityStats {
		attack: { modifier: number };
		defense: { modifier: number };
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
			held: ItemSet;
			bag?: ItemSet;
		};
		map: Map;
	}
}
