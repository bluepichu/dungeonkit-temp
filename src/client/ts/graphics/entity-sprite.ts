"use strict";

import {AnimatedSprite} from "./animated-sprite";
import * as Constants   from "../constants";
import * as utils       from "../../../common/utils";

export class EntitySprite extends AnimatedSprite {
	private _direction: number;
	private useReflection: boolean;

	constructor(descriptor: Game.Graphics.EntityGraphics) {
		super(descriptor.base, descriptor.object);
		this.useReflection = descriptor.useReflection;
		this.direction = 6;
	}

	protected handleOffset(sprite: PIXI.Sprite, amount: number): void {
		let [dy, dx] = utils.decodeDirection(this.direction);

		dx *= amount * Constants.GRID_SIZE;
		dy *= amount * Constants.GRID_SIZE;

		sprite.x += dx;
		sprite.y += dy;
	}

	get direction(): number {
		return this._direction;
	}

	set direction(direction: number) {
		this._direction = direction;
		this.changed = true;
	}

	protected getTexture(frame: Game.Graphics.Frame): PIXI.Texture {
		let dir = this.direction;

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

		let textureName = sprintf(frame.texture, { dir: dir });
		return PIXI.Texture.fromFrame(sprintf("%s-%s", this.base, textureName));
	}

	protected prerenderLayer(layer: PIXI.Sprite, frame: Game.Graphics.Frame) {
		if (this.useReflection) {
			if (this.direction < 2 || this.direction > 6) {
				layer.scale.x = -1;
				layer.x += layer.texture.width;
			} else {
				layer.scale.x = 1;
			}
		}
	}
}

