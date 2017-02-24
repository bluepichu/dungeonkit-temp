"use strict";

import {
	CanvasRenderer,
	Container,
	WebGLRenderer
} from "pixi.js";

import * as GraphicsDescriptorCache from "./graphics-descriptor-cache";
import GraphicsObject               from "./graphics-object";
import * as Tweener                 from "./tweener";

export default Layer;
export abstract class Layer<T extends GraphicsObject> extends Container {
	protected map: Map<string, T>;

	constructor() {
		super();
		this.map = new Map();
	}

	protected abstract generateGraphicsObject(key: string): T;

	public add(id: string, descriptor: string, location: Point): void {
		if (this.has(id)) {
			throw new Error(`Already have object with id ${id}.`);
		}

		let obj = this.generateGraphicsObject(descriptor);

		obj.x = location.x;
		obj.y = location.y;

		this.map.set(id, obj);

		this.addChild(obj);
	}

	public has(id: string): boolean {
		return this.map.has(id);
	}

	public get(id: string): T {
		return this.map.get(id);
	}

	public remove(id: string): void {
		if (this.map.has(id)) {
			this.removeChild(this.map.get(id));
			this.map.delete(id);
		}
	}

	public clear(): void {
		this.map.forEach((child) => this.removeChild(child));
		this.map.clear();
	}

	protected prerender(): void {}

	public renderWebGL(renderer: WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}

	public renderCanvas(renderer: CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}
}