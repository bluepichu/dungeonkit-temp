"use strict";

import * as Colors    from "./colors";
import {EntityLayer}  from "./entity-layer";
import {EntitySprite} from "./graphics/entity-sprite";
import * as state     from "./state";
import {TweenHandler} from "./tween-handler";

const STYLES: { [key: string]: PIXI.MultiTextStyle } = {
	def: {
		font: "300 14px Lato",
		fill: Colors.WHITE
	},
	title: {
		font: "300 20px Lato",
		fill: Colors.YELLOW
	},
	header: {
		font: "700 14px Lato",
		fill: Colors.WHITE
	},
	strategy: {
		font: "400 12px Lato",
		fill: Colors.GRAY_6
	},
	icon: {
		font: "300 14px DK Icons",
		fill: Colors.WHITE
	},
	denom: {
		font: "300 10px Lato",
		fill: Colors.GRAY_5,
		valign: "middle"
	},
	statup: {
		font: "400 10px Lato",
		fill: Colors.BLUE,
		valign: "middle"
	},
	statdown: {
		font: "400 10px Lato",
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
				let listing = new TeamListing(entity as Crawl.CensoredSelfCrawlEntity);

				y -= listing.height;
				listing.y = y;
				y -= 20;

				this.addChild(listing);
			});
	}
}

class TeamListing extends PIXI.Container {
	private bg: PIXI.Graphics;

	private entitySprite: EntitySprite;
	private nameText: PIXI.Text;
	private strategyText: PIXI.Text;

	private statsHeader: PIXI.Text;
	private hpText: PIXI.MultiStyleText;
	private attackText: PIXI.MultiStyleText;
	private defenseText: PIXI.MultiStyleText;
	private hungerText: PIXI.MultiStyleText;

	private itemsHeader: PIXI.Text;
	private itemsText: PIXI.Text[];

	constructor(entity: Crawl.CensoredSelfCrawlEntity) {
		super();

		this.bg = new PIXI.Graphics();
		this.addChild(this.bg);
		this.bg.beginFill(Colors.BLACK, .9);
		this.bg.drawRect(-10, 0, 230, 140);
		this.bg.endFill();

		this.entitySprite = new EntitySprite(EntityLayer.entityGraphicsCache.get(entity.graphics));
		this.entitySprite.direction = 7;
		this.entitySprite.x = 40;
		this.entitySprite.y = 28;
		this.entitySprite.scale.x = 1.5;
		this.entitySprite.scale.y = 1.5;
		this.addChild(this.entitySprite);

		this.nameText = new PIXI.Text(entity.name, STYLES["title"]);
		this.nameText.anchor.x = .5;
		this.nameText.anchor.y = .5;
		this.nameText.x = 130;
		this.nameText.y = 18;
		this.nameText.resolution = window.devicePixelRatio;
		this.addChild(this.nameText);

		this.strategyText = new PIXI.Text("Leader", STYLES["strategy"]);
		this.strategyText.anchor.x = .5;
		this.strategyText.anchor.y = .5;
		this.strategyText.x = 130;
		this.strategyText.y = 35;
		this.strategyText.resolution = window.devicePixelRatio;
		this.addChild(this.strategyText);

		this.statsHeader = new PIXI.Text("STATS", STYLES["header"]);
		this.statsHeader.x = 12;
		this.statsHeader.y = 50;
		this.statsHeader.resolution = window.devicePixelRatio;
		this.addChild(this.statsHeader);

		this.hpText = new PIXI.MultiStyleText(
			`<icon>hp</icon> ${entity.stats.hp.current} <denom>/ ${entity.stats.hp.max}</denom>`,
			STYLES);
		this.hpText.x = 16;
		this.hpText.y = 70;
		this.hpText.resolution = window.devicePixelRatio;
		this.addChild(this.hpText);

		this.hungerText = new PIXI.MultiStyleText(
			`<icon>hp</icon> ${100} <denom>/ ${100}</denom>`,
			STYLES);
		this.hungerText.x = 16;
		this.hungerText.y = 86;
		this.hungerText.resolution = window.devicePixelRatio;
		this.addChild(this.hungerText);

		if (entity.stats.attack.modifier !== 0) {
			this.attackText = new PIXI.MultiStyleText(
				`<icon>attack</icon> ${entity.stats.attack.base}  ` +
					(entity.stats.attack.modifier < 0
						? `<statdown>${entity.stats.attack.modifier}</statdown>`
						: `<statup>+${entity.stats.attack.modifier}</statup>`),
				STYLES);
		} else {
			this.attackText = new PIXI.MultiStyleText(`<icon>attack</icon> ${entity.stats.attack.base}`, STYLES);
		}
		this.attackText.x = 16;
		this.attackText.y = 102;
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
		this.defenseText.x = 16;
		this.defenseText.y = 118;
		this.defenseText.resolution = window.devicePixelRatio;
		this.addChild(this.defenseText);

		this.statsHeader = new PIXI.Text("ITEMS", STYLES["header"]);
		this.statsHeader.x = 98;
		this.statsHeader.y = 50;
		this.statsHeader.resolution = window.devicePixelRatio;
		this.addChild(this.statsHeader);

		this.itemsText = entity.items.held.items.map((item) => new PIXI.Text(item.name, STYLES["def"]));

		if (entity.items.held.items.length < entity.items.held.capacity) {
			this.itemsText.push(
				new PIXI.Text(`(Can hold ${entity.items.held.capacity - entity.items.held.items.length} more)`, STYLES["def"]));
		}

		if (entity.items.bag !== undefined) {
			this.itemsText.push(
				new PIXI.Text(`Bag (${entity.items.bag.items.length}/${entity.items.bag.capacity})`, STYLES["def"]));
		}

		this.itemsText.forEach((text, i) => {
			text.x = 102;
			text.y = 70 + 16 * i;
			text.resolution = window.devicePixelRatio;
			this.addChild(text);
		});
	}
}