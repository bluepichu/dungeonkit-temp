"use strict";

import {
	CanvasRenderer,
	Container,
	RenderTexture,
	SCALE_MODES,
	Sprite,
	WebGLRenderer
} from "pixi.js";

import Constants  from "../constants";
import * as utils from "../../../common/utils";

abstract class Cache<U, E> {
	private cache: Map<string, E>;
	protected _renderer: CanvasRenderer | WebGLRenderer;

	public constructor() {
		this.cache = new Map();
		this._renderer = undefined;
	}

	public set renderer(renderer: CanvasRenderer | WebGLRenderer) {
		this._renderer = renderer;
	}

	public set(key: string, descriptor: U) {
		if (this.cache.has(key)) {
			return;
		}

		this.cache.set(key, this.expand(descriptor));
	}

	public get(key: string) {
		if (!this.cache.has(key)) {
			throw new Error(`[Error x]: Requested key ${key} not in the graphics cache.`);
		}

		return this.cache.get(key);
	}

	protected abstract expand(descriptor: U): E;
}

class GraphicsObjectCache extends Cache<GraphicsObjectDescriptor, ExpandedGraphicsObjectDescriptor> {
	protected expand(descriptor: GraphicsObjectDescriptor): ExpandedGraphicsObjectDescriptor {
		return expandDescriptor(this._renderer, descriptor);
	}
}

class EntityGraphicsCache extends Cache<EntityGraphicsDescriptor, ExpandedEntityGraphicsDescriptor> {
	protected expand(descriptor: EntityGraphicsDescriptor): ExpandedEntityGraphicsDescriptor {
		let ret: ExpandedEntityGraphicsDescriptor = [];

		for (let i = 0; i < 8; i++) {
			let key: number;
			let reflect: boolean;

			if (i in descriptor.descriptors) {
				key = i;
				reflect = false;
			} else if (descriptor.useReflection && ((12 - i) % 8) in descriptor.descriptors) {
				key = (12 - i) % 8;
				reflect = true;
			} else {
				throw new Error(`[Error x]: Illegal entity graphics descriptor does not contain a key for direction ${i}.`);
			}

			let expanded = expandDescriptor(this._renderer, descriptor.descriptors[key], i, reflect);

			ret.push(expanded);
		}

		return ret;
	}
}

let graphicsCache: GraphicsObjectCache = new GraphicsObjectCache();
let entityCache: EntityGraphicsCache = new EntityGraphicsCache();

export function setRenderer(renderer: WebGLRenderer | CanvasRenderer): void {
	graphicsCache.renderer = renderer;
	entityCache.renderer = renderer;
}

export function setGraphics(key: string, descriptor: GraphicsObjectDescriptor): void {
	graphicsCache.set(key, descriptor);
}

export function getGraphics(key: string): ExpandedGraphicsObjectDescriptor {
	return graphicsCache.get(key);
}

export function setEntityGraphics(key: string, descriptor: EntityGraphicsDescriptor): void {
	entityCache.set(key, descriptor);
}

export function getEntityGraphics(key: string): ExpandedEntityGraphicsDescriptor {
	return entityCache.get(key);
}

function expandDescriptor(
		renderer: WebGLRenderer | CanvasRenderer,
		descriptor: GraphicsObjectDescriptor,
		direction: number = 0,
		reflect: boolean = false): ExpandedGraphicsObjectDescriptor {
	let expanded: ExpandedGraphicsObjectDescriptor = {};
	let [dr, dc] = utils.decodeDirection(direction);

	for (let animation in descriptor.animations) {
		expanded[animation] = [];
		for (let frame of descriptor.animations[animation]) {

			let container = new Container();

			for (let spriteDescriptor of frame.sprites) {
				let sprite = Sprite.fromFrame(`${descriptor.base}-${spriteDescriptor.texture}`);

				sprite.pivot.x = spriteDescriptor.anchor.x;
				sprite.pivot.y = spriteDescriptor.anchor.y;

				if (reflect) {
					sprite.scale.x = -1;
				}

				if (spriteDescriptor.offset) {
					sprite.x = dc * spriteDescriptor.offset * Constants.GRID_SIZE;
					sprite.y = dr * spriteDescriptor.offset * Constants.GRID_SIZE;
				}

				container.addChildAt(sprite, 0);
			}

			let texture = RenderTexture.create(
					container.getBounds().width,
					container.getBounds().height,
					SCALE_MODES.NEAREST,
					window.devicePixelRatio);

			let anchor = {
				x: -container.getBounds().x,
				y: -container.getBounds().y
			};

			Object.assign(container, anchor);

			renderer.render(container, texture);

			expanded[animation].push({
				duration: frame.duration,
				texture,
				anchor
			});
		}
	}

	return expanded;
}