"use strict";

import {
	Container,
	CanvasRenderer,
	WebGLRenderer
} from "pixi.js";

/**
 * An extension of Pixi's Container that allows for a prerender function that adds processing on a per-frame basis.
 */
export default class PrerenderContainer extends Container {
	/**
	 * Called before the layer is rendered.  Intended to be overridden by implementing classes.
	 */
	protected prerender(): void {}

	/**
	 * Renders the PrerenderContainer using the given CanvasRenderer.
	 * @param renderer - The renderer.
	 */
	public renderCanvas(renderer: CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	/**
	 * Renders the PrerenderContainer using the given WebGLRenderer.
	 * @param renderer - The renderer.
	 */
	public renderWebGL(renderer: WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}
}