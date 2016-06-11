"use strict";

import * as Constants from "../constants";

export class AnimatedSprite extends PIXI.Container {
	protected descriptor: Game.Graphics.AnimatedGraphicsObject;
	private animation: string;
	private step: number;
	private frame: number;
	protected base: string;
	protected changed: boolean;
	protected sprites: PIXI.Sprite[];
	protected animationEndListeners: (() => any)[];

	constructor(base: string, descriptor: Game.Graphics.AnimatedGraphicsObject) {
		super();
		this.descriptor = descriptor;
		this.animation = descriptor.default;
		this.step = 0;
		this.frame = 0;
		this.base = base;
		this.scale.x = Constants.SCALE;
		this.scale.y = Constants.SCALE;
		this.changed = true;
		this.animationEndListeners = [];

		let spriteCount = 0;

		for (let animation in this.descriptor.animations) {
			this.descriptor.animations[animation].steps.forEach((step) => {
				spriteCount = Math.max(spriteCount, step.frames.length);
			});
		}

		this.sprites = [];

		for (let i = 0; i < spriteCount; i++) {
			this.sprites.push(new PIXI.Sprite());
		}

		for (let i = spriteCount - 1; i >= 0; i--) {
			this.addChild(this.sprites[i]);
		}
	}

	addAnimationEndListener(f: () => any) {
		this.animationEndListeners.push(f);
	}

	setAnimation(animation: string): void {
		if (this.animation !== animation) {
			this.animation = animation;
			this.step = 0;
			this.frame = 0;
			this.changed = true;
		}
	}

	protected handleOffset(sprite: PIXI.Sprite, amount: number): void { }

	protected getTexture(frame: Game.Graphics.Frame): PIXI.Texture {
		return PIXI.Texture.fromFrame(sprintf("%s-%s", this.base, frame.texture));
	}

	prerender() {
		this.frame++;

		if (this.frame >= this.descriptor.animations[this.animation].steps[this.step].duration) {
			this.frame = 0;
			this.step++;
			this.step %= this.descriptor.animations[this.animation].steps.length;
			this.changed = true;
		}

		if (this.frame === 0 && this.step === 0) {
			this.animationEndListeners.forEach((f) => f());
			this.animationEndListeners = [];
		}

		if (!this.changed) {
			return;
		}

		let frames = this.descriptor.animations[this.animation].steps[this.step].frames;

		for (let i = 0; i < this.sprites.length; i++) {
			if (i >= frames.length) {
				this.sprites[i].visible = false;
			} else {
				this.sprites[i].visible = true;
				this.sprites[i].texture = this.getTexture(frames[i]);

				this.sprites[i].width = this.sprites[i].texture.width;
				this.sprites[i].height = this.sprites[i].texture.height;

				this.sprites[i].x = -frames[i].anchor.x;
				this.sprites[i].y = -frames[i].anchor.y;

				if (frames[i].offset !== undefined) {
					this.handleOffset(this.sprites[i], frames[i].offset);
				}
			}
		}

		this.changed = false;
	}

	renderCanvas(renderer: PIXI.CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	renderWebGL(renderer: PIXI.WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}
}