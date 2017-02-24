"use strict";

import {
	Container,
	CanvasRenderer,
	WebGLRenderer
} from "pixi.js";

export default class PrerenderContainer extends Container {
	protected prerender() {}

	public renderWebGL(renderer: WebGLRenderer) {
		this.prerender();
		super.renderWebGL(renderer);
	}

	public renderCanvas(renderer: CanvasRenderer) {
		this.prerender();
		super.renderCanvas(renderer);
	}
}