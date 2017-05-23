interface PlacedGraphicsObject {
	graphics: string;
	position: Point;
}

type OverworldBackground = PlacedGraphicsObject[];

interface OverworldEntity extends Entity {
	position: Point;
	direction: Direction;
	interact?(): IterableIterator<Interaction>;
}

interface PlayerOverworldEntity extends Entity {
	position: Point;
	direction: Direction;
}

type Interaction = SpeakingInteraction | CrawlInteraction | TransitionInteraction;

interface SpeakingInteraction {
	type: "speak";
	speaker?: string;
	portrait?: string;
	text: string;
	responses?: string[];
}

interface CrawlInteraction {
	type: "crawl";
	dungeon: string;
}

interface TransitionInteraction {
	type: "transition";
	scene: OverworldScene;
	start: {
		position: Point;
		direction: Direction;
	};
}

interface Hotzone {
	id: string;
	area: Polygon;
	interact?(): IterableIterator<Interaction>;
}

interface OverworldScene {
	background: OverworldBackground;
	bounds: Rect;
	entities: OverworldEntity[];
	obstacles: Polygon[];
	hotzones: Hotzone[];
}