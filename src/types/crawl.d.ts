type CrawlState = InProgressCrawlState | ConcludedCrawlState;

interface InProgressCrawlState {
	dungeon: Dungeon;
	floor: Floor;
	entities: CrawlEntity[];
	items: CrawlItem[];
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
	graphics: string;
}

interface Floor {
	number: number;
	map: FloorMap;
}

type CrawlItem = Item & Locatable;

interface FloorMap {
	width: number;
	height: number;
	grid: DungeonTile[][];
}

interface DungeonTile {
	type: DungeonTileType;
	roomId?: number;
	stairs?: boolean;
}

declare const enum DungeonTileType {
	UNKNOWN,
	FLOOR,
	WALL
}

interface CrawlLocation {
	r: number;
	c: number;
}

interface Locatable {
	location: CrawlLocation;
}

interface UnplacedCrawlEntity extends Entity {
	controller: Controller;
	alignment: number;
	advances: boolean;
}

interface CrawlEntity extends UnplacedCrawlEntity, Locatable {
	map: FloorMap;
}

interface CondensedEntity {
	id: string;
	name: string;
	graphics: string;
}

type LogEvent = WaitLogEvent | MoveLogEvent | AttackLogEvent | StatLogEvent | DefeatLogEvent | StairsLogEvent
	| StartLogEvent | MissLogEvent | MessageLogEvent | ItemPickupLogEvent | ItemDropLogEvent;

interface WaitLogEvent {
	type: "wait";
	entity: CondensedEntity;
	location: CrawlLocation;
}

interface MoveLogEvent {
	type: "move";
	entity: CondensedEntity;
	start: CrawlLocation;
	end: CrawlLocation;
	direction: number;
}

interface AttackLogEvent {
	type: "attack";
	entity: CondensedEntity;
	location: CrawlLocation;
	attack: Attack;
	direction: number;
}

interface StatLogEvent {
	type: "stat";
	entity: CondensedEntity;
	location: CrawlLocation;
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
	location: CrawlLocation;
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
	scale: number;
	rooms: Distribution;
	junctions: Distribution;
	features: {
		rooms: Feature[];
	};
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
	graphics: string;
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
	map: FloorMap;
}