import {GraphicsObject} from "./graphics-object";
import * as Tweener     from "./tweener";

export abstract class Layer<D> extends PIXI.Container {
	protected map: Map<string, GraphicsObject>;

	protected abstract generateGraphicsObject(descriptor: D): GraphicsObject;

	constructor() {
		super();
		this.map = new Map();
	}

	public addObject(id: string, descriptor: D, location: Point): void {
		let obj = this.generateGraphicsObject(descriptor);

		obj.x = location.x;
		obj.y = location.y;

		this.map.set(id, obj);

		this.addChild(obj);
	}

	public removeObject(id: string): void {
		if (this.map.has(id)) {
			this.removeChild(this.map.get(id));
			this.map.delete(id);
		}
	}

	public moveObject(id: string, target: Point, speed: number): Thenable {
		if (!this.map.has(id)) {
			throw new Error(`No object with id ${id}.`);
		}

		return Tweener.tween(this.map.get(id), target, speed);
	}

	public setObjectAnimation(id: string, animation: string, wait: boolean): Thenable {
		if (!this.map.has(id)) {
			throw new Error(`No object with id ${id}.`);
		}

		let promise = this.map.get(id).setAnimation(animation);

		if (wait) {
			return promise;
		} else {
			return Promise.resolve();
		}
	}

	public clear(): void {
		this.removeChildren();
		this.map.clear();
	}

	private prerender(): void {
		this.children.sort(
			(a: PIXI.DisplayObject, b: PIXI.DisplayObject) => a.y - b.y);
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