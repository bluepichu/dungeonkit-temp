"use strict";

import * as Constants  from "./constants";
import {EntityManager} from "./entity-manager";
import {GroundManager} from "./ground-manager";
import {ItemManager}   from "./item-manager";
import * as state      from "./state";
import * as Tweener    from "./graphics/tweener";
import * as utils      from "../../common/utils";

export class DungeonRenderer extends PIXI.Container {
	public groundManager: GroundManager;
	public itemManager: ItemManager;
	public entityManager: EntityManager;
	private _viewport: Viewport;
	private _zoomOut: boolean;

	constructor() {
		super();

		this.groundManager = new GroundManager();
		this.itemManager = new ItemManager();
		this.entityManager = new EntityManager();

		this.addChild(this.groundManager);
		this.addChild(this.itemManager);
		this.addChild(this.entityManager);

		this._zoomOut = false;
	}

	init(): void {
		let {x: offsetX, y: offsetY} = utils.locationToPoint(state.getState().self.location, Constants.GRID_SIZE);

		[this.groundManager.x, this.groundManager.y] = [-offsetX, -offsetY];
		[this.itemManager.x, this.itemManager.y] = [-offsetX, -offsetY];
		[this.entityManager.x, this.entityManager.y] = [-offsetX, -offsetY];
	}

	moveEntity(
		entity: CondensedEntity,
		start: CrawlLocation,
		end: CrawlLocation,
		isSelf: boolean,
		animation?: string,
		direction?: number): Thenable {

		if (!this.entityManager.hasObject(entity.id)) {
			this.entityManager.addObject(entity.id, entity.graphics, utils.locationToPoint(start, Constants.GRID_SIZE));
		}

		let prm = this.entityManager.moveObject(entity.id,
				utils.locationToPoint(end, Constants.GRID_SIZE),
				Constants.WALK_SPEED);
		this.entityManager.setObjectDirection(entity.id, direction);
		this.entityManager.setObjectAnimation(entity.id, animation, false);

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

		let {x, y} = utils.locationToPoint(center, Constants.GRID_SIZE);
		let pos = { x: -x, y: -y };

		Tweener.tween(this.groundManager, pos, Constants.VIEW_MOVE_VELOCITY, "smooth");
		Tweener.tween(this.itemManager, pos, Constants.VIEW_MOVE_VELOCITY, "smooth");
		Tweener.tween(this.entityManager, pos, Constants.VIEW_MOVE_VELOCITY, "smooth");
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
		let roomBounds = this.groundManager.getRoomBounds(utils.getTile(state.getState().floor.map, location).roomId);

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

	clear(): void {
		this.groundManager.clear();
		this.entityManager.clear();
	}
}