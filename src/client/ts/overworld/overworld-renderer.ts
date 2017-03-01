"use strict";

import {
	CanvasRenderer,
	Container,
	WebGLRenderer
} from "pixi.js";

import Colors               from "../colors";
import Constants            from "../constants";
import OverworldEntityLayer from "./overworld-entity-layer";
import GraphicsObject       from "../graphics/graphics-object";
import OverworldGroundLayer from "./overworld-ground-layer";
import OverworldItemLayer   from "./overworld-item-layer";
import * as Tweener         from "../graphics/tweener";
import * as utils           from "../../../common/utils";

export default class OverworldRenderer extends Container {
	private _viewport: Viewport;
	private _zoomOut: boolean;
	private groundLayer: OverworldGroundLayer;
	private itemLayer: OverworldItemLayer;
	private entityLayer: OverworldEntityLayer;
	private selfId: string;

	constructor() {
		super();

		this.groundLayer = new OverworldGroundLayer();
		this.itemLayer = new OverworldItemLayer();
		this.entityLayer = new OverworldEntityLayer();

		this.addChild(this.groundLayer);
		this.addChild(this.itemLayer);
		this.addChild(this.entityLayer);

		this._zoomOut = false;
	}

	public displayScene(cos: ClientOverworldScene): void {
		console.info("Displaying scene", cos);
		this.clear();

		this.selfId = cos.self.id;

		this.groundLayer.display(cos.scene.background);
		// TODO (bluepichu): someting with the item layer?
		this.entityLayer.display(cos.scene.entities.concat([cos.self]));

		this.updateViewport(cos.self.position);
	}

	public moveTo(position: Point): void {
		this.entityLayer.moveEntityTo(this.selfId, position);

		this.updateViewport(position);
	}

	public walk(direction: number): void {
		this.entityLayer.get(this.selfId).setAnimationOrContinue("walk");
		this.entityLayer.get(this.selfId).direction = direction;
	}

	public idle(): void {
		this.entityLayer.get(this.selfId).setAnimation("default");
	}

	private updateViewport(position: Point): void {
		this.scale.x = 3;
		this.scale.y = 3;

		this.groundLayer.x = -position.x;
		this.groundLayer.y = -position.y;

		this.itemLayer.x = -position.x;
		this.itemLayer.y = -position.y;

		this.entityLayer.x = -position.x;
		this.entityLayer.y = -position.y;
	}

	public clear(): void {
		this.groundLayer.clear();
		this.entityLayer.clear();
		this.itemLayer.clear();
	}
}