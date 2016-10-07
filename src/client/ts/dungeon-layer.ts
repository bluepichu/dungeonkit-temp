"use strict";

import * as Constants from "./constants";
import {EntityLayer}  from "./entity-layer";
import {GroundLayer}  from "./ground-layer";
import {ItemLayer}    from "./item-layer";
import * as state     from "./state";
import {TweenHandler} from "./tween-handler";
import * as utils     from "../../common/utils";

export class DungeonLayer extends PIXI.Container {
	public groundLayer: GroundLayer;
	public itemLayer: ItemLayer;
	public entityLayer: EntityLayer;
	public tweenHandler: TweenHandler;
	private _viewport: Viewport;
	private _zoomOut: boolean;

	constructor(tweenHandler: TweenHandler) {
		super();

		this.groundLayer = new GroundLayer(tweenHandler);
		this.itemLayer = new ItemLayer(tweenHandler);
		this.entityLayer = new EntityLayer(tweenHandler);

		this.addChild(this.groundLayer);
		this.addChild(this.itemLayer);
		this.addChild(this.entityLayer);

		this.tweenHandler = tweenHandler;
		this._zoomOut = false;
	}

	init(): void {
		let [offsetX, offsetY] = utils.locationToCoordinates(state.getState().self.location, Constants.GRID_SIZE);

		[this.groundLayer.x, this.groundLayer.y] = [-offsetX, -offsetY];
		[this.itemLayer.x, this.itemLayer.y] = [-offsetX, -offsetY];
		[this.entityLayer.x, this.entityLayer.y] = [-offsetX, -offsetY];
	}

	moveEntity(
		entity: CondensedEntity,
		from: CrawlLocation,
		to: CrawlLocation,
		isSelf: boolean,
		animation?: string,
		direction?: number): Thenable {
		let prm = this.entityLayer.moveEntity(entity, from, to);
		this.entityLayer.setEntityAnimation(entity.id, animation, direction);

		if (isSelf) {
			this.updatePosition(to);
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

		this.tweenHandler.tween(this.scale, "x", newScale, Constants.VIEW_ZOOM_VELOCITY, "smooth");
		this.tweenHandler.tween(this.scale, "y", newScale, Constants.VIEW_ZOOM_VELOCITY, "smooth");
		this.groundLayer.moveTo(center);
		this.groundLayer.updateVisibility();
		this.itemLayer.moveTo(center);
		this.entityLayer.moveTo(center);
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

	updatePosition(location: CrawlLocation): void {
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

	showAnimationOnce(entityId: string, animation: string, direction?: number): Thenable {
		this.entityLayer.setEntityAnimation(entityId, animation, direction);
		return new Promise((resolve, _) => this.entityLayer.setAnimationEndListener(entityId, resolve));
	}

	getEntityDirection(entityId: string): number {
		return this.entityLayer.spriteFloorMap.get(entityId).direction;
	}

	clear(): void {
		this.groundLayer.clear();
		this.entityLayer.clear();
	}
}