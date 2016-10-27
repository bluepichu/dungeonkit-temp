"use strict";

import Colors       from "./colors";
import * as state   from "./state";
import * as Tweener from "./graphics/tweener";

export default class AttackOverlay extends PIXI.Container {
	public children: AttackListing[];
	private _active: boolean;

	constructor() {
		super();
	}

	public set active(active: boolean) {
		if (this._active !== active) {
			if (active) {
				this.showMoves();
			} else {
				this.hideMoves();
			}
		}

		this._active = active;
	}

	public get active(): boolean {
		return this._active;
	}

	public update(): void {
		if (this.children.length > 0) {
			return;
		}

		state.getState().self.attacks.forEach((attack: Attack, i: number) => {
			if (this.children.length <= i) {
				let child = new AttackListing(i + 1, attack);

				child.x = -600;
				child.y = i * 60 + 10;

				this.addChild(child);
			}

			this.children[i].update(attack);
		});
	}

	private showMoves(): void {
		this.children.forEach((child, i) =>
			setTimeout(() => Tweener.tween(child, { x: 0 }, 1.1, "smooth"), i * 100));
	}

	private hideMoves(): void {
		this.children.forEach((child, i) =>
			setTimeout(() => Tweener.tween(child, { x: -600 }, 1.1, "smooth"), i * 100));
	}
}

class AttackListing extends PIXI.Container {
	private bg: PIXI.Graphics;
	private indexText: PIXI.Text;
	private nameText: PIXI.Text;
	private powerText: PIXI.Text;
	private accuracyText: PIXI.Text;
	private usesText: PIXI.Text;

	constructor(indexText: number, attack: Attack) {
		super();

		this.bg = new PIXI.Graphics();
		this.bg.beginFill(Colors.BLUE);
		this.bg.drawPolygon([0, 0, 300, 0, 270, 50, 0, 50]);
		this.bg.endFill();
		this.addChild(this.bg);

		this.indexText = new PIXI.Text(indexText.toString(), {
			font: "400 32px Lato",
			fill: Colors.WHITE
		});
		this.indexText.anchor.x = .5;
		this.indexText.anchor.y = .5;
		this.indexText.x = 32;
		this.indexText.y = 25;
		this.indexText.resolution = window.devicePixelRatio;
		this.addChild(this.indexText);

		this.nameText = new PIXI.Text("", {
			font: "300 24px Lato",
			fill: Colors.WHITE
		});
		this.nameText.anchor.y = .5;
		this.nameText.x = 60;
		this.nameText.y = 25;
		this.nameText.alpha = .8;
		this.nameText.resolution = window.devicePixelRatio;
		this.addChild(this.nameText);

		this.powerText = new PIXI.Text("", {
			font: "300 16px Lato",
			fill: Colors.WHITE
		});
		this.powerText.anchor.x = 1;
		this.powerText.x = 250;
		this.powerText.y = 8;
		this.powerText.alpha = .8;
		this.powerText.resolution = window.devicePixelRatio;
		this.addChild(this.powerText);

		this.accuracyText = new PIXI.Text("", {
			font: "300 16px Lato",
			fill: Colors.WHITE
		});
		this.accuracyText.anchor.x = 1;
		this.accuracyText.x = 250;
		this.accuracyText.y = 28;
		this.accuracyText.alpha = .8;
		this.accuracyText.resolution = window.devicePixelRatio;
		this.addChild(this.accuracyText);

		this.usesText = new PIXI.Text("", {
			font: "300 16px Lato",
			fill: Colors.WHITE
		});
		this.usesText.anchor.x = .5;
		this.usesText.anchor.y = .5;
		this.usesText.x = 275;
		this.usesText.y = 25;
		this.usesText.rotation = -1.03;
		this.usesText.alpha = .6;
		this.usesText.resolution = window.devicePixelRatio;
		this.addChild(this.usesText);

		this.update(attack);
	}

	update(attack: Attack) {
		this.nameText.text = attack.name;
		this.powerText.text = attack.power !== undefined ? attack.power + " POW" : "";
		this.accuracyText.text = attack.accuracy === "always" ? "Always hits" : attack.accuracy + " ACC";
		this.usesText.text = attack.uses.current + "/" + attack.uses.max;
	}
}