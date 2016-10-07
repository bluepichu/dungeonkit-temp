"use strict";

import {AnimatedSprite} from "./animated-sprite";
import * as Constants   from "../constants";
import * as utils       from "../../../common/utils";

export class EntitySprite extends AnimatedSprite {
	private _direction: number;
	private useReflection: boolean;
	private statusMarkers: AnimatedSprite[];
	private statusIndex: number;

	constructor(descriptor: EntityGraphics) {
		super(descriptor.base, descriptor);
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

	protected getTexture(frame: Frame): PIXI.Texture {
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

		let textureName = sprintf(frame.texture, { dir: dir });
		return PIXI.Texture.fromFrame(sprintf("%s-%s", this.base, textureName));
	}

	protected prerenderLayer(layer: PIXI.Sprite, frame: Frame) {
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

	public addStatusMarker(marker: AnimatedSprite): void {
		this.statusMarkers.push(marker);

		marker.x = 12;
		marker.y = -18;

		if (this.statusMarkers.length === 1) {
			this.addChild(marker);
			marker.addAnimationEndListener(this.advanceStatusAnimation.bind(this));
		}
	}

	private advanceStatusAnimation(): void {
		this.removeChild(this.statusMarkers[this.statusIndex]);
		this.statusIndex++;
		this.statusIndex %= this.statusMarkers.length;
		this.addChild(this.statusMarkers[this.statusIndex]);
		this.statusMarkers[this.statusIndex].reset();
		this.statusMarkers[this.statusIndex].addAnimationEndListener(this.advanceStatusAnimation.bind(this));
	}
}

