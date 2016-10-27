"use strict";

import Constants             from "./constants";
import EntityManager         from "./entity-manager";
import GraphicsObject        from "./graphics/graphics-object";
import GroundManager         from "./ground-manager";
import ItemManager           from "./item-manager";
import {generate as shortid} from "shortid";
import * as state            from "./state";
import * as Tweener          from "./graphics/tweener";
import * as utils            from "../../common/utils";

class Layer extends PIXI.Container {
	public children: GraphicsObject[]; // Narrower typing
}

export default class OverworldRenderer extends PIXI.Container {
	public groundManager: GroundManager;
	public itemManager: ItemManager;
	public entityManager: EntityManager;

	private container: Layer;

	public constructor() {
		super();

		this.container = new Layer();

		this.addChild(this.container);

		this.groundManager = new GroundManager(this.container);
		this.itemManager = new ItemManager(this.container);
		this.entityManager = new EntityManager(this.container);
	}

	public setScene(scene: OverworldScene): void {
		this.clear();

		for (let obj of scene.background) {
			this.groundManager.addObject(shortid(), obj.graphics, obj.position);
		}

		// TODO: items

		for (let entity of scene.entities) {
			this.entityManager.addObject(entity.id, entity.graphics, entity.position);
		}
	}

	public clear(): void {
		this.groundManager.clear();
		this.entityManager.clear();
		this.itemManager.clear();
	}

	protected prerender(): void {
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