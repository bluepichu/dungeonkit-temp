"use strict";

import {
	Container,
	Graphics
} from "pixi.js";

import MultiStyleText, { TextStyleSet } from "pixi-multistyle-text";

import Colors from "./colors";

const OPTION_STYLES: TextStyleSet = {
	default: {
		fontFamily: "Lato",
		fontSize: "16px",
		fontWeight: "400",
		fill: Colors.BLACK,
		align: "right",
		wordWrapWidth: 580
	},
	self: {
		fill: Colors.YELLOW
	},
	ally: {
		fill: Colors.ORANGE
	},
	enemy: {
		fill: Colors.RED
	},
	item: {
		fill: Colors.BLUE
	},
	command: {
		fill: Colors.PURPLE
	},
	attack: {
		fill: Colors.BROWN
	}
};

export default class Menu extends Container {
	private _selection: number;
	private options: Option[];

	public constructor(options: string[]) {
		super();

		this._selection = 0;

		let bg = new Graphics();
		bg.beginFill(Colors.WHITE);
		bg.lineStyle(4, Colors.BLACK);
		bg.drawRect(-10, -10, 200, options.length * 20 + 20);
		this.addChild(bg)

		this.options = options.map((text, i) => {
			let opt = new Option(text);
			opt.y = i * 20;
			this.addChild(opt);
			return opt;
		});

		this.options[0].selected = true;
	}

	public prev(): void {
		this.options[this._selection].selected = false;
		this._selection++;
		this._selection %= this.options.length;
		this.options[this._selection].selected = true;
	}

	public next(): void {
		this.options[this._selection].selected = false;
		this._selection--;
		this._selection += this.options.length;
		this._selection %= this.options.length;
		this.options[this._selection].selected = true;
	}

	public get selection(): number {
		return this._selection;
	}
}

class Option extends Container {
	private text: MultiStyleText;
	private cursor: Graphics;
	private bg: Graphics;

	public constructor(text: string) {
		super();

		this.cursor = new Graphics();
		this.cursor.x = 4;
		this.cursor.y = 4;
		this.cursor.beginFill(Colors.BLACK);
		this.cursor.drawPolygon([-4, 0, 2, 5, -4, 10]);
		this.addChild(this.cursor);

		this.text = new MultiStyleText(text, OPTION_STYLES);
		this.text.x = 12;
		this.addChild(this.text);

		this.selected = false;
	}

	public set selected(sel: boolean) {
		this.cursor.visible = sel;
	}
}