interface PlacedGraphicsObject extends GraphicsObjectDescriptor {
	position: Point;
}

type OverworldBackground = PlacedGraphicsObject[];

interface OverworldEntity extends Entity {
	position: Point;
	interact?(): Iterable<Interaction>;
}

interface Interaction {
	speaker: string;
	portrait: string;
	text: string;
	responses?: string[];
}

interface OverworldScreen {
	background: OverworldBackground;
	bounds: Polygon;
	entities: OverworldEntity[];
}