interface PlacedGraphicsObject {
	graphics: string;
	position: Point;
}

type OverworldBackground = PlacedGraphicsObject[];

interface OverworldEntity extends Entity {
	position: Point;
	interact?(): IterableIterator<Interaction>;
}

interface PlayerOverworldEntity extends Entity {
	position: Point;
	controller: Controller;
}

type Interaction = SpeakingInteraction | CrawlInteraction;

interface SpeakingInteraction {
	type: "speak";
	speaker?: string;
	portrait?: string;
	text: string;
	responses?: string[];
}

interface CrawlInteraction {
	type: "crawl";
	dungeon: Dungeon;
}

interface Hotzone {
	id: string;
	area: Polygon;
	interact?(): IterableIterator<Interaction>;
}

interface OverworldScene {
	background: OverworldBackground;
	bounds: Polygon;
	entities: OverworldEntity[];
	obstacles: Polygon[];
	hotzones: Hotzone[];
}