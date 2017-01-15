"use strict";

import {
	CanvasRenderer,
	Container,
	WebGLRenderer
} from "pixi.js";

import Constants      from "./constants";
import DeltaLayer     from "./delta-layer";
import EntityLayer    from "./entity-layer";
import GraphicsObject from "./graphics/graphics-object";
import GroundLayer    from "./ground-layer";
import ItemLayer      from "./item-layer";
import * as state     from "./state";
import * as Tweener   from "./graphics/tweener";
import * as utils     from "../../common/utils";

export default class DungeonRenderer extends Container {
	public groundLayer: GroundLayer;
	public itemLayer: ItemLayer;
	public entityLayer: EntityLayer;
	public deltaLayer: DeltaLayer;

	private _viewport: Viewport;
	private _zoomOut: boolean;

	constructor(renderer: CanvasRenderer | WebGLRenderer) {
		super();

		this.groundLayer = new GroundLayer(renderer, state.getState().dungeon.graphics);
		this.itemLayer = new ItemLayer();
		this.entityLayer = new EntityLayer();
		this.deltaLayer = new DeltaLayer();

		this.addChild(this.groundLayer);
		this.addChild(this.itemLayer);
		this.addChild(this.entityLayer);
		this.addChild(this.deltaLayer);

		this._zoomOut = false;
	}

	moveEntity(
		entity: CondensedEntity,
		start: CrawlLocation,
		end: CrawlLocation,
		isSelf: boolean,
		animation?: string,
		direction?: number): Thenable {

		if (!this.entityLayer.hasObject(entity.id)) {
			this.entityLayer.addObject(entity.id, entity.graphics, utils.locationToPoint(start, Constants.GRID_SIZE));
		}

		let prm = this.entityLayer.moveObject(entity.id,
				utils.locationToPoint(end, Constants.GRID_SIZE),
				Constants.WALK_SPEED);
		this.entityLayer.setObjectDirection(entity.id, direction);
		this.entityLayer.setObjectAnimation(entity.id, animation, false);

		if (isSelf) {
			this.updatePosition(end);
		}

		return prm;
	}

	private updateViewport(nextView: Viewport) {
		let center = {
			r: (nextView.r[0] + nextView.r[1]) / 2,
			c: (nextView.c[0] + nextView.c[1]) / 2
		};

		let newScale = Math.min(window.innerHeight / (nextView.r[1] - nextView.r[0]),
			window.innerWidth / (nextView.c[1] - nextView.c[0])) * .8 / Constants.GRID_SIZE;

		newScale = Math.min(newScale, 4);

		Tweener.tween(this.scale, { x: newScale, y: newScale }, Constants.VIEW_ZOOM_VELOCITY, "smooth");

		let {x: cx, y: cy} = utils.locationToPoint(center, Constants.GRID_SIZE);

		Tweener.tween(this.groundLayer, {x: -cx, y: -cy}, Constants.VIEW_MOVE_VELOCITY, "smooth");
		Tweener.tween(this.itemLayer, {x: -cx, y: -cy}, Constants.VIEW_MOVE_VELOCITY, "smooth");
		Tweener.tween(this.entityLayer, {x: -cx, y: -cy}, Constants.VIEW_MOVE_VELOCITY, "smooth");
		Tweener.tween(this.deltaLayer, {x: -cx, y: -cy}, Constants.VIEW_MOVE_VELOCITY, "smooth");
	}

	set zoomOut(zoom: boolean) {
		if (this._zoomOut !== zoom) {
			if (zoom) {
				this.updateViewport({
					r: [0, state.getState().floor.map.height],
					c: [0, state.getState().floor.map.width]
				});
			} else {
				this.updateViewport(this._viewport);
			}
		}
		this._zoomOut = zoom;
	}

	public updatePosition(location: CrawlLocation): void {
		let roomBounds = this.groundLayer.getRoomBounds(utils.getTile(state.getState().floor.map, location).roomId);

		if (utils.isVoid(roomBounds)) { // in a hallway or don't know the bounds of the current room
			this._viewport = {
				r: [location.r - 2, location.r + 2],
				c: [location.c - 2, location.c + 2]
			};
		} else { // in a room whose bounds we know
			this._viewport = {
				r: [roomBounds.r[0] - 2, roomBounds.r[1] + 2],
				c: [roomBounds.c[0] - 2, roomBounds.c[1] + 2]
			};
		}

		if (!this._zoomOut) {
			this.updateViewport(this._viewport);
		}
	}

	public displayDelta(location: CrawlLocation, color: number, amount: number): Thenable {
		return this.deltaLayer.displayDelta(location, color, amount);
	}

	public clear(): void {
		this.groundLayer.clear();
		this.entityLayer.clear();
		this.itemLayer.clear();
	}
}