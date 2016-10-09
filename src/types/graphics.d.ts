/**
 * Describes the graphics for a dungeon.
 */
interface DungeonGraphicsDescriptor {
	walls: DungeonTileSelector[];
	open: GraphicsObjectDescriptor;
	stairs: GraphicsObjectDescriptor;
}

/**
 * Describes the graphics for a dungeon tile given the wall pattern around it.
 */
interface DungeonTileSelector {
	pattern: number;
	object: GraphicsObjectDescriptor;
}

/**
 * The cache for entity graphics.
 */
type EntityGraphicsCache = Map<string, EntityGraphicsDescriptor>;

/**
 * Describes an entity's graphics.
 */
interface EntityGraphicsDescriptor extends GraphicsObjectDescriptor {
	useReflection?: boolean;
}

/**
 * Describes an animated graphics object.
 */
interface GraphicsObjectDescriptor {
	base: string;
	animations: { [key: string]: AnimationDescriptor };
}

/**
 * Describes an animation.
 */
type AnimationDescriptor = FrameDescriptor[];

/**
 * Describes a single frame of an animation.
 */
interface FrameDescriptor {
	sprites: SpriteDescriptor[];
	duration: number;
}

/**
 * Describes a single frame.
 */
interface SpriteDescriptor {
	texture: string;
	anchor: Point;
	offset?: number;
}