"use strict";

import {AnimatedSprite} from "./animated-sprite";
import * as Constants   from "../constants";
import * as utils       from "../utils";

export class EntitySprite extends AnimatedSprite {
	private _direction: number;

	constructor(base: string, descriptor: Game.Graphics.AnimatedGraphicsObject) {
		super(base, descriptor);
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
		let textureName = sprintf(frame.texture, { dir: this.direction });
		return PIXI.Texture.fromFrame(sprintf("%s-%s", this.base, textureName));
	}
}

