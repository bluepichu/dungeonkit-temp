"use strict";

import {
	CanvasRenderer,
	Container,
	Sprite,
	Texture,
	WebGLRenderer
} from "pixi.js";

import Constants from "../constants";
import isMobile  from "../is-mobile";

export default class GraphicsObject extends Sprite {
	public z: number;

	protected descriptor: ExpandedGraphicsObjectDescriptor;
	protected changed: boolean;
	protected animationEndListener: () => any;

	private animation: string;
	private step: number;
	private frame: number;

	constructor(descriptor: ExpandedGraphicsObjectDescriptor) {
		super();
		this.descriptor = descriptor;
		this.animation = "default";
		this.step = 0;
		this.frame = 0;
		this.changed = true;
		this.animationEndListener = undefined;
		this.z = 0;

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

	protected handleOffset(sprite: Sprite, amount: number): void { }

	private prerender() {
		this.frame++;

		if (this.frame >= this.descriptor[this.animation][this.step].duration) {
			this.frame = 0;
			this.step++;
			this.step %= this.descriptor[this.animation].length;
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

		this.texture = this.descriptor[this.animation][this.step].texture;
		Object.assign(this.pivot, this.descriptor[this.animation][this.step].anchor);
		this.changed = false;
	}

	protected prerenderLayer(layer: Sprite, sprite: SpriteDescriptor): void {
		// do nothing
	}

	public renderCanvas(renderer: CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	public renderWebGL(renderer: WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}
}