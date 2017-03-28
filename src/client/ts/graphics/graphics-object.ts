"use strict";

import {
	CanvasRenderer,
	Container,
	Sprite,
	Texture,
	WebGLRenderer
} from "pixi.js";

import Constants from "../constants";

/**
 * A single displayed object.
 */
export default class GraphicsObject extends Sprite {
	public z: number;

	protected descriptor: ExpandedGraphicsObjectDescriptor;
	protected changed: boolean;
	protected animationEndListener: () => any;
	protected animation: string;
	protected step: number;
	protected frame: number;

	/**
	 * Constructs a new GraphicsObject with the graphics given in the descriptor.
	 * @param descriptor - The descriptor to use.
	 */
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

	/**
	 * Sets the animation, resetting it to the first frame even if it is already playing.
	 * @param animation - The animation to which to switch.
	 * @return A promise that will resolve when the animation has completed one loop.
	 */
	public setAnimation(animation: string): Thenable {
		return new Promise((resolve, reject) => {
			this.animation = animation;
			this.step = 0;
			this.frame = 0;
			this.changed = true;
			this.animationEndListener = resolve;
		});
	}

	/**
	 * Sets the animation.  If the given animation is already playing, it isn't reset to the first frame and the
	 *     returned promise resolves immediately; otherwise, resolves when the animation has completed its first loop.
	 * @param animation - The animation to which to switch.
	 * @return A promise that will resolve when the animation has completed one loop, or immediately if the given
	 *     animation is already playing.
	 */
	public setAnimationOrContinue(animation: string): Thenable {
		return new Promise((resolve, reject) => {
			if (this.animation === animation) {
				return Promise.resolve;
			}
			return this.setAnimation(animation);
		});
	}

	/**
	 * Resets the current animation to the beginning of its first frame.
	 */
	public reset(): void {
		this.step = 0;
		this.frame = 0;
	}

	/**
	 * Run before the object is rendered.  Steps the frame, switches out the texture, and triggers the end-animation if
	 *     necessary.
	 */
	protected prerender() {
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

	/**
	 * Renders the GrahpicsObject using the given CanvasRenderer.
	 * @param renderer - The renderer.
	 */
	public renderCanvas(renderer: CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	/**
	 * Renders the GrahpicsObject using the given WebGLRenderer.
	 * @param renderer - The renderer.
	 */
	public renderWebGL(renderer: WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}
}