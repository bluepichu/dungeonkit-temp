import {AnimatedSprite} from "./animated-sprite";

export function generate(descriptor: GraphicsObjectDescriptor): PIXI.DisplayObject {
	return new AnimatedSprite(descriptor);
}