"use strict";

import {
	Texture,
	Sprite
} from "pixi.js";

import Constants      from "../constants";
import GraphicsObject from "./graphics-object";
import * as utils     from "../../../common/utils";

export default class EntitySprite extends GraphicsObject {
	private _direction: number;
	private statusMarkers: GraphicsObject[];
	private statusIndex: number;
	private entityGraphicsDescriptor: ExpandedEntityGraphicsDescriptor;

	constructor(descriptor: ExpandedEntityGraphicsDescriptor) {
		super(descriptor[0]);
		this.entityGraphicsDescriptor = descriptor;
		this.direction = 6;
		this.statusMarkers = [];
		this.statusIndex = 0;
	}

	public get direction(): number {
		return this._direction;
	}

	public set direction(direction: number) {
		if (direction < 0 || direction >= 8 || !Number.isInteger(direction)) {
			throw new Error(`Invalid direction ${direction}.`);
		}

		if (direction !== this._direction) {
			this._direction = direction;
			this.changed = true;
			this.descriptor = this.entityGraphicsDescriptor[direction];
			this.reset();
		}
	}

	public clearStatusMarkers(): void {
		this.removeChild(this.statusMarkers[this.statusIndex]);
		this.statusMarkers = [];
		this.statusIndex = 0;
	}
}

