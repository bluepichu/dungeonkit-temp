"use strict";

import * as Colors    from "./colors";
import {EntityLayer}  from "./entity-layer";
import {EntitySprite} from "./graphics/entity-sprite";
import * as state     from "./state";
import {TweenHandler} from "./tween-handler";

const STYLES: { [key: string]: PIXI.MultiTextStyle } = {
	def: {
		font: "300 16px Lato",
		fill: Colors.WHITE
	},
	title: {
		font: "100 40px Lato",
		fill: Colors.YELLOW
	},
	icon: {
		font: "300 16px DK Icons",
		fill: Colors.WHITE
	},
	denom: {
		font: "300 12px Lato",
		fill: Colors.GRAY_5,
		valign: "bottom"
	},
	statup: {
		font: "700 12px Lato",
		fill: Colors.BLUE,
		valign: "middle"
	},
	statdown: {
		font: "700 12px Lato",
		fill: Colors.RED,
		valign: "middle"
	},
};

export class TeamOverlay extends PIXI.Container {
	public children: TeamListing[];

	constructor() {
		super();
	}

	public update() {
		this.removeChildren();

		let y = -50;

		state.getState().entities
			.filter((entity) => entity.alignment === state.getState().self.alignment)
			.reverse()
			.forEach((entity, i) => {
				let listing = new TeamListing(entity as Game.Crawl.CensoredSelfCrawlEntity);

				y -= listing.height;
				listing.y = y;
				y -= 20;

				this.addChild(listing);
			});
	}
}

class TeamListing extends PIXI.Container {
	private bg: PIXI.Graphics;
	private nameText: PIXI.Text;
	private entitySprite: EntitySprite;
	private itemSlots: ItemSlot[];
	private hpText: PIXI.MultiStyleText;
	private attackText: PIXI.MultiStyleText;
	private defenseText: PIXI.MultiStyleText;

	constructor(entity: Game.Crawl.CensoredSelfCrawlEntity) {
		super();

		this.bg = new PIXI.Graphics();
		this.addChild(this.bg);

		this.nameText = new PIXI.Text(entity.name, STYLES["title"]);
		this.nameText.x = 60;
		this.nameText.y = 2;
		this.nameText.resolution = window.devicePixelRatio;
		this.addChild(this.nameText);

		this.entitySprite = new EntitySprite(EntityLayer.entityGraphicsCache.get(entity.graphics));
		this.entitySprite.direction = 7;
		this.entitySprite.x = 30;
		this.entitySprite.y = 28;
		this.entitySprite.scale.x = 1.5;
		this.entitySprite.scale.y = 1.5;
		this.addChild(this.entitySprite);

		this.hpText = new PIXI.MultiStyleText(
			`<icon>hp</icon> ${entity.stats.hp.current} <denom>/ ${entity.stats.hp.max}</denom>`,
			STYLES);
		this.hpText.x = 16 + this.nameText.x + this.nameText.width;
		this.hpText.y = 6;
		this.hpText.resolution = window.devicePixelRatio;
		this.addChild(this.hpText);

		if (entity.stats.attack.modifier !== 0) {
			this.attackText = new PIXI.MultiStyleText(
				`<icon>attack</icon> ${entity.stats.attack.base}  ` +
					(entity.stats.attack.modifier < 0
						? `<statdown>${entity.stats.attack.modifier}</statdown>`
						: `<statup>+${entity.stats.attack.modifier}</statup>`),
				STYLES);
		} else {
			this.defenseText = new PIXI.MultiStyleText(`<icon>attack</icon> ${entity.stats.attack.base}`, STYLES);
		}
		this.attackText.x = 20 + this.hpText.x + this.hpText.width;
		this.attackText.y = 6;
		this.attackText.resolution = window.devicePixelRatio;
		this.addChild(this.attackText);

		if (entity.stats.defense.modifier !== 0) {
			this.defenseText = new PIXI.MultiStyleText(
				`<icon>defense</icon> ${entity.stats.defense.base}  ` +
					(entity.stats.defense.modifier < 0
						? `<statdown>${entity.stats.defense.modifier}</statdown>`
						: `<statup>+${entity.stats.defense.modifier}</statup>`),
				STYLES);
		} else {
			this.defenseText = new PIXI.MultiStyleText(`<icon>defense</icon> ${entity.stats.defense.base}`, STYLES);
		}
		this.defenseText.x = 20 + this.hpText.x + this.hpText.width;
		this.defenseText.y = 28;
		this.defenseText.resolution = window.devicePixelRatio;
		this.addChild(this.defenseText);

		this.bg.beginFill(Colors.BLACK, .9);
		this.bg.drawPolygon([
			0, 0,
			this.attackText.x + this.attackText.width + 40, 0,
			this.attackText.x + this.attackText.width + 10, 50,
			0, 50]);
		this.bg.endFill();

		this.itemSlots = [];

		for (let i = 0; i < entity.items.held.capacity; i++) {
			this.itemSlots.push(new ItemSlot(entity.items.held.items[i]));
		}

		this.itemSlots.forEach((itemSlot, i) => {
			itemSlot.y = 50 + 28 * i;
			this.addChild(itemSlot);
		});
	}
}

class ItemSlot extends PIXI.Container {
	private bg: PIXI.Graphics;
	private text: PIXI.Text;

	constructor(item: Game.Item) {
		super();

		this.bg = new PIXI.Graphics();
		this.bg.beginFill(Colors.GRAY_1, .8);
		this.bg.drawRect(0, 0, 200, 28);
		this.bg.lineStyle(1, Colors.BLACK, .8);
		this.bg.moveTo(0, 28);
		this.bg.lineTo(200, 28);
		this.bg.endFill();
		this.bg.lineStyle(0);
		this.addChild(this.bg);

		if (item === undefined) {
			this.text = new PIXI.Text("<No Item>", {
				font: "300 16px Lato",
				fill: Colors.GRAY_5
			});
		} else {
			this.text = new PIXI.Text(item.name, {
				font: "300 16px Lato",
				fill: Colors.WHITE
			});
		}
		this.text.x = 40;
		this.text.y = 4;
		this.text.resolution = window.devicePixelRatio;
		this.addChild(this.text);
	}
}