"use strict";

import Colors        from "./colors";
import EntityManager from "./entity-manager";
import EntitySprite  from "./graphics/entity-sprite";
import * as state    from "./state";
import * as Tweener  from "./graphics/tweener";

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
		font: "700 10px Lato",
		fill: Colors.GRAY_6
	},
	icon: {
		font: "300 12px DK Icons",
		valign: "middle"
	},
	hp: {
		font: "700 10px Lato",
		fill: Colors.BLUE
	},
	hunger: {
		font: "700 10px Lato",
		fill: Colors.YELLOW
	}
};

export default class TeamOverlay extends PIXI.Container {
	public children: TeamListing[];
	private map: Map<string, TeamListing>;

	constructor() {
		super();

		this.map = new Map();
	}

	public update() {
		let current = new Set(this.map.keys());
		let visible = new Set(state.getState().entities.filter((entity) => entity.alignment == state.getState().self.alignment).map((entity) => entity.id));
		let toAdd = new Set([...visible].filter((id) => !current.has(id)));
		let toRemove = new Set([...current].filter((id) => !visible.has(id)));

		toRemove.forEach((id) => {
			let listing = this.map.get(id);
			Tweener.tween(listing, { x: -300 }, 0.8, "smooth")
				.then(() => {
					this.removeChild(listing);
					this.map.delete(id);
				});
			this.map.delete(id);
		});

		this.map.forEach((listing, id) => {
			let entity = state.getState().entities.filter((entity) => entity.id === id)[0];
			listing.update(entity as CensoredSelfCrawlEntity);
		});

		toAdd.forEach((id) => {
			let entity = state.getState().entities.filter((entity) => entity.id === id)[0];
			let listing = new TeamListing(entity as CensoredSelfCrawlEntity);
			this.addChild(listing);
			listing.x = 170;
			this.map.set(id, listing);
		});

		let index = 0;

		this.map.forEach((listing) => {
			listing.y = -70 * (this.map.size - index);
			index++;
		});
	}
}

class TeamListing extends PIXI.Container {
	private bg: PIXI.Graphics;
	private entitySprite: EntitySprite;
	private nameText: PIXI.Text;
	private strategyText: PIXI.Text;
	private hpArc: PIXI.Graphics;
	private hpText: PIXI.Text;
	private hungerArc: PIXI.Graphics;
	private hungerText: PIXI.Text;

	constructor(entity: CensoredSelfCrawlEntity) {
		super();

		this.bg = new PIXI.Graphics();
		this.addChild(this.bg);
		this.bg.beginFill(Colors.BLACK, .9);
		this.bg.drawRect(-240, -30, 240, 60);
		this.bg.arc(0, 0, 30, Math.PI / 2, 3 * Math.PI / 2, true);
		this.bg.endFill();

		this.entitySprite = new EntitySprite(EntityManager.entityGraphicsCache.get(entity.graphics));
		this.entitySprite.direction = 7;
		this.entitySprite.x = -4;
		this.entitySprite.y = 4;
		this.entitySprite.scale.x = 1.5;
		this.entitySprite.scale.y = 1.5;
		this.addChild(this.entitySprite);

		this.nameText = new PIXI.Text("", STYLES["title"]);
		this.nameText.anchor.x = 1;
		this.nameText.anchor.y = 1;
		this.nameText.x = -30;
		this.nameText.y = 4;
		this.nameText.resolution = window.devicePixelRatio;
		this.addChild(this.nameText);

		this.strategyText = new PIXI.Text("", STYLES["strategy"]);
		this.strategyText.anchor.x = 1;
		this.strategyText.anchor.y = 0;
		this.strategyText.x = -30;
		this.strategyText.y = 6;
		this.strategyText.resolution = window.devicePixelRatio;
		this.addChild(this.strategyText);

		this.hpArc = new PIXI.Graphics();
		this.addChild(this.hpArc);

		this.hpText = new PIXI.MultiStyleText("", STYLES);
		this.hpText.anchor.x = 1;
		this.hpText.anchor.y = 0;
		this.hpText.x = -134;
		this.hpText.y = -30;
		this.hpText.resolution = window.devicePixelRatio;
		this.addChild(this.hpText);

		this.hungerArc = new PIXI.Graphics();
		this.hungerArc.lineStyle(2, Colors.YELLOW);
		this.hungerArc.arc(0, 0, 25, 0, Math.PI/2, false);
		this.hungerArc.moveTo(0, 25).lineTo(-130, 25);
		this.addChild(this.hungerArc);

		this.hungerText = new PIXI.MultiStyleText("", STYLES);
		this.hungerText.anchor.x = 1;
		this.hungerText.anchor.y = 1;
		this.hungerText.x = -134;
		this.hungerText.y = 32;
		this.hungerText.resolution = window.devicePixelRatio;
		this.addChild(this.hungerText);

		this.update(entity);
	}

	public update(entity: CensoredSelfCrawlEntity): void {
		this.nameText.text = entity.name;
		this.strategyText.text = "LEADER";

		this.hpText.text = `<hp><icon>hp</icon>${entity.stats.hp.current}</hp>`;

		let arcLength = Math.PI / 2 * 25;
		let lineLength = 130;
		let totalLength = arcLength + lineLength;

		let hpPct = entity.stats.hp.current / entity.stats.hp.max;
		let hpLength = totalLength * hpPct;

		STYLES["hp"].fill = this.colorToString(this.getHpColor(hpPct));

		this.hpArc.clear();
		this.hpArc.lineStyle(2, this.getHpColor(hpPct));
		this.hpArc.moveTo(-lineLength, -25).lineTo(-lineLength + Math.min(lineLength, hpLength), -25);

		if (hpLength > lineLength) {
			let hpArcLength = hpLength - lineLength;
			let hpAngle = hpArcLength / arcLength * Math.PI / 2;
			this.hpArc.arc(0, 0, 25, -Math.PI/2, -Math.PI/2 + hpAngle);
		}

		this.hungerText.text = `<hunger><icon>defense</icon>${Math.ceil(entity.stats.belly.current / 6)}</hunger>`;

		let hungerPct = Math.ceil(entity.stats.belly.current / 6) / Math.ceil(entity.stats.belly.max / 6);
		let hungerLength = totalLength * hungerPct;

		STYLES["hunger"].fill = this.colorToString(this.getHungerColor(hungerPct));

		this.hungerArc.clear();
		this.hungerArc.lineStyle(2, this.getHungerColor(hungerPct));
		this.hungerArc.moveTo(-lineLength, 25).lineTo(-lineLength + Math.min(lineLength, hungerLength), 25);

		if (hungerLength > lineLength) {
			let hungerArcLength = hungerLength - lineLength;
			let hungerAngle = hungerArcLength / arcLength * Math.PI / 2;
			this.hungerArc.arc(0, 0, 25, Math.PI/2, Math.PI/2 - hungerAngle, true);
		}
	}

	private colorToString(color: number): string {
		let hex = color.toString(16);
		let padding = "000000".substring(hex.length);
		return `#${padding}${hex}`;
	}

	private getHpColor(pct: number): number {
		if (pct < 0.1) {
			return Colors.RED;
		} else if (pct < 0.25) {
			return Colors.ORANGE;
		} else if (pct < 0.5) {
			return Colors.YELLOW;
		} else if (pct < 1) {
			return Colors.GREEN;
		} else {
			return Colors.BLUE;
		}
	}

	private getHungerColor(pct: number): number {
		if (pct < 0.1) {
			return Colors.RED;
		} else if (pct < 0.2) {
			return Colors.ORANGE
		} else {
			return Colors.YELLOW;
		}
	}
}