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
 * The cache for entity 
 */
type EntityGraphicsCache = Map<string, EntityGraphics>;

/**
 * Describes an entity's 
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