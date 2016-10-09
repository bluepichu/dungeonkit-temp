type OverworldBackground = PlacedGraphicsObject[];

interface PlacedGraphicsObject extends GraphicsObjectDescriptor {
	position: Point;
}

interface OverworldScreen {
	background: OverworldBackground;

}