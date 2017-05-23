"use strict";

import {
	Texture,
	Sprite
} from "pixi.js";

import Constants      from "../constants";
import GraphicsObject from "./graphics-object";
import * as utils     from "../../../common/utils";

/**
 * Displays a single entity, allowing switches between animations and directions.
 */
export default class EntitySprite extends GraphicsObject {
	private _direction: Direction;
	private entityGraphicsDescriptor: ExpandedEntityGraphicsDescriptor;

	/**
	 * Constructs a new EntitySprite using the given graphics descriptor.
	 */
	constructor(descriptor: ExpandedEntityGraphicsDescriptor) {
		super(descriptor[Direction.SOUTH]);
		this.entityGraphicsDescriptor = descriptor;
		this.direction = Direction.SOUTH;
	}

	/**
	 * The direction the entity sprite is facing.
	 */
	public get direction(): Direction {
		return this._direction;
	}

	public set direction(direction: Direction) {
		if (direction !== this._direction) {
			this._direction = direction;
			this.changed = true;
			this.descriptor = this.entityGraphicsDescriptor[direction];
		}
	}
}

