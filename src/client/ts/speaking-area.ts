"use strict";

import {
	Container,
	Graphics,
	TextStyle,
	Sprite
} from "pixi.js";

import MultiStyleText, { TextStyleSet } from "pixi-multistyle-text";

import Colors         from "./colors";
import * as Tweener   from "./graphics/tweener";

const SPEAKING_STYLES: TextStyleSet = {
	default: {
		fontFamily: "Lato",
		fontSize: "16px",
		fontWeight: "300",
		fill: Colors.WHITE,
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

export default class SpeakingArea extends Container {
	background: Graphics;
	text: MultiStyleText;

	speakerBackgorund: Graphics;
	speakerText: MultiStyleText;

	portraitBackground: Graphics;
	portrait: Sprite;

	constructor() {
		super();

		this.background = new Graphics();
		this.background.beginFill(Colors.BLACK, .8);
		this.background.drawRect(-300, -100, 600, 100);

		this.text = new MultiStyleText("", SPEAKING_STYLES);
		this.text.x = -290;
		this.text.y = -90;

		this.speakerBackgorund = new Graphics();

		this.speakerText = new MultiStyleText("", SPEAKING_STYLES);
		this.speakerText.x = -275;
		this.speakerText.y = -124;

		this.portraitBackground = new Graphics();
	}

	showSpeech(speech: SpeakingInteraction) : void {
		this.addChild(this.background);
		this.addChild(this.text);
		this.text.text = speech.text;

		this.addChild(this.speakerBackgorund);
		this.speakerBackgorund.clear();
		this.addChild(this.speakerText);
		this.speakerText.text = speech.speaker;

		this.speakerBackgorund.beginFill(Colors.BLUE, .8);
		this.speakerBackgorund.drawPolygon([
				-300, -100,
				-280, -130,
				-270 + this.speakerText.width, -130,
				-250 + this.speakerText.width, -100
			]);

		if (speech.portrait !== undefined) {
			// this.addChild(this.portraitBackground);
			// this.portrait = portrait;
			// this.addChild(portrait);
		}
	}

	hide(): void {
		this.removeChildren();
	}
}