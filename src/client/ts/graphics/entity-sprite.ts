"use strict";

import * as Constants   from "../constants";
import {GraphicsObject} from "./graphics-object";
import * as utils       from "../../../common/utils";

export class EntitySprite extends GraphicsObject {
	private _direction: number;
	private useReflection: boolean;
	private statusMarkers: GraphicsObject[];
	private statusIndex: number;

	constructor(descriptor: EntityGraphicsDescriptor) {
		super(descriptor);
		this.useReflection = descriptor.useReflection;
		this.direction = 6;
		this.statusMarkers = [];
		this.statusIndex = 0;
	}

	protected handleOffset(sprite: PIXI.Sprite, amount: number): void {
		let [dy, dx] = utils.decodeDirection(this.direction);

		dx *= amount * Constants.GRID_SIZE;
		dy *= amount * Constants.GRID_SIZE;

		sprite.x += dx;
		sprite.y += dy;
	}

	public get direction(): number {
		return this._direction;
	}

	public set direction(direction: number) {
		this._direction = direction;
		this.changed = true;
	}

	protected getTexture(sprite: SpriteDescriptor): PIXI.Texture {
		let dir = this.direction !== undefined ? this.direction : 6; // default to straight ahead if not set

		if (this.useReflection) {
			switch (this.direction) {
				case 0:
					dir = 4;
					break;

				case 1:
					dir = 3;
					break;

				case 7:
					dir = 5;
					break;
			}
		}

		let textureName = sprintf(sprite.texture, { dir: dir });
		return PIXI.Texture.fromFrame(sprintf("%s-%s", this.descriptor.base, textureName));
	}

	protected prerenderLayer(layer: PIXI.Sprite, sprite: SpriteDescriptor) {
		if (this.useReflection) {
			if (this.direction < 2 || this.direction > 6) {
				layer.scale.x = -1;
				layer.x += layer.texture.width;
			} else {
				layer.scale.x = 1;
			}
		}
	}

	public clearStatusMarkers(): void {
		this.removeChild(this.statusMarkers[this.statusIndex]);
		this.statusMarkers = [];
		this.statusIndex = 0;
	}
}

