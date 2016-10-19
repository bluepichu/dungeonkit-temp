"use strict";

import * as Constants from "../constants";
import {isMobile}     from "../is-mobile";

export class GraphicsObject extends PIXI.Container {
	public z: number;

	protected descriptor: GraphicsObjectDescriptor;
	protected changed: boolean;
	protected sprites: PIXI.Sprite[];
	protected animationEndListener: () => any;

	private animation: string;
	private step: number;
	private frame: number;

	constructor(descriptor: GraphicsObjectDescriptor) {
		super();
		this.descriptor = descriptor;
		this.animation = "default";
		this.step = 0;
		this.frame = 0;
		this.changed = true;
		this.animationEndListener = undefined;
		this.z = 0;

		let spriteCount = 0;

		for (let animation in this.descriptor.animations) {
			this.descriptor.animations[animation].forEach((step) => {
				spriteCount = Math.max(spriteCount, step.sprites.length);
			});
		}

		this.sprites = [];

		for (let i = 0; i < spriteCount; i++) {
			this.sprites.push(new PIXI.Sprite());
		}

		for (let i = spriteCount - 1; i >= 0; i--) {
			this.addChild(this.sprites[i]);
		}

		this.prerender();
	}

	public setAnimation(animation: string): Thenable {
		return new Promise((resolve, reject) => {
			this.animation = animation;
			this.step = 0;
			this.frame = 0;
			this.changed = true;
			this.animationEndListener = resolve;
		});
	}

	public reset(): void {
		this.step = 0;
		this.frame = 0;
	}

	protected handleOffset(sprite: PIXI.Sprite, amount: number): void { }

	protected getTexture(sprite: SpriteDescriptor): PIXI.Texture {
		return PIXI.Texture.fromFrame(sprintf("%s-%s", this.descriptor.base, sprite.texture));
	}

	private prerender() {
		if (this.descriptor.animations[this.animation].length == 0) {
			return; // Optimize static objects - no need to reset the texture every frame
		}

		this.frame++;

		if (this.frame >= this.descriptor.animations[this.animation][this.step].duration) {
			this.frame = 0;
			this.step++;
			this.step %= this.descriptor.animations[this.animation].length;
			this.changed = true;
		}

		if (this.frame === 0 && this.step === 0) {
			if (this.animationEndListener) {
				this.animationEndListener();
				this.animationEndListener = undefined;
			}
		}

		if (!this.changed) {
			return;
		}

		let sprites = this.descriptor.animations[this.animation][this.step].sprites;

		for (let i = 0; i < this.sprites.length; i++) {
			if (i >= sprites.length) {
				this.sprites[i].visible = false;
			} else {
				this.sprites[i].visible = true;
				this.sprites[i].texture = this.getTexture(sprites[i]);

				this.sprites[i].width = this.sprites[i].texture.width;
				this.sprites[i].height = this.sprites[i].texture.height;

				this.sprites[i].x = -sprites[i].anchor.x;
				this.sprites[i].y = -sprites[i].anchor.y;

				this.prerenderLayer(this.sprites[i], sprites[i]);

				if (sprites[i].offset !== undefined) {
					this.handleOffset(this.sprites[i], sprites[i].offset);
				}
			}
		}

		this.changed = false;
	}

	protected prerenderLayer(layer: PIXI.Sprite, sprite: SpriteDescriptor): void {
		// do nothing
	}

	public renderCanvas(renderer: PIXI.CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	public renderWebGL(renderer: PIXI.WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}
}