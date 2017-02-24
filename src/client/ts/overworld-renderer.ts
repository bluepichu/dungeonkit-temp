"use strict";

import {
	CanvasRenderer,
	Container,
	WebGLRenderer
} from "pixi.js";

import Constants             from "./constants";
import EntityManager         from "./entity-layer";
import GraphicsObject        from "./graphics/graphics-object";
import GroundManager         from "./ground-layer";
import ItemManager           from "./item-layer";
import {generate as shortid} from "shortid";
import * as Tweener          from "./graphics/tweener";
import * as utils            from "../../common/utils";

export default class OverworldRenderer extends Container { /*
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
		this.container.children.sort((a, b) => (a.z === b.z) ? (b.y - a.y) : (a.z - b.z));
	}

	public renderCanvas(renderer: CanvasRenderer) {
		this.prerender();
		super.renderCanvas(renderer);
	}

	public renderWebGL(renderer: WebGLRenderer) {
		this.prerender();
		super.renderWebGL(renderer);
	} */
}