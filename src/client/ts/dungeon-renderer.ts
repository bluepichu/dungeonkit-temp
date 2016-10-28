"use strict";

import Constants      from "./constants";
import EntityManager  from "./entity-manager";
import GraphicsObject from "./graphics/graphics-object";
import GroundManager  from "./ground-manager";
import ItemManager    from "./item-manager";
import * as state     from "./state";
import * as Tweener   from "./graphics/tweener";
import * as utils     from "../../common/utils";

class Layer extends PIXI.Container {
	public children: GraphicsObject[]; // Narrower typing
}

export default class DungeonRenderer extends PIXI.Container {
	public groundManager: GroundManager;
	public itemManager: ItemManager;
	public entityManager: EntityManager;

	private container: Layer;
	private _viewport: Viewport;
	private _zoomOut: boolean;

	constructor() {
		super();

		this.container = new Layer();

		this.addChild(this.container);

		this.groundManager = new GroundManager(this.container);
		this.itemManager = new ItemManager(this.container);
		this.entityManager = new EntityManager(this.container);

		this._zoomOut = false;
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

		let {x: cx, y: cy} = utils.locationToPoint(center, Constants.GRID_SIZE);

		Tweener.tween(this.container, {x: -cx, y: -cy}, Constants.VIEW_MOVE_VELOCITY, "smooth");
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
		this.itemManager.clear();
	}

	prerender(): void {
		this.container.children.sort((a, b) => (a.z == b.z) ? (b.y - a.y) : (a.z - b.z));
	}

	public renderCanvas(renderer: PIXI.CanvasRenderer) {
		this.prerender();
		super.renderCanvas(renderer);
	}

	public renderWebGL(renderer: PIXI.WebGLRenderer) {
		this.prerender();
		super.renderWebGL(renderer);
	}
}