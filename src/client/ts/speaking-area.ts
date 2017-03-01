"use strict";

import {
	CanvasRenderer,
	Container,
	Graphics,
	Text,
	TextStyle,
	Sprite,
	WebGLRenderer
} from "pixi.js";

import MultiStyleText, { TextStyleSet } from "pixi-multistyle-text";

import Colors         from "./colors";
import * as Tweener   from "./graphics/tweener";

const SPEAKING_STYLES: TextStyleSet = {
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

export default class SpeakingArea extends Container {
	private background: Graphics;
	private text: MultiStyleText;

	private speakerBackgorund: Graphics;
	private speakerText: Text;

	private portraitBackground: Graphics;
	private portrait: Sprite;

	private targetText: string;
	private frameCounter: number;

	public constructor() {
		super();

		this.background = new Graphics();
		this.background.beginFill(Colors.WHITE);
		this.background.lineStyle(4, Colors.BLACK);
		this.background.drawRect(-300, -100, 600, 100);

		this.text = new MultiStyleText("", SPEAKING_STYLES);
		this.text.x = -290;
		this.text.y = -90;

		this.speakerBackgorund = new Graphics();

		this.speakerText = new Text("", Object.assign({}, SPEAKING_STYLES["default"], { fill: Colors.WHITE }));
		this.speakerText.x = -275;
		this.speakerText.y = -124;

		this.portraitBackground = new Graphics();
		this.portraitBackground.beginFill(Colors.BLACK);
		this.portraitBackground.drawRect(-294, -224, 88, 88);

		this.targetText = "";

		this.frameCounter = 0;
	}

	public showSpeech(speech: SpeakingInteraction) : void {
		this.addChild(this.background);
		this.addChild(this.text);
		this.text.text = "";
		this.targetText = speech.text;

		this.addChild(this.speakerBackgorund);
		this.speakerBackgorund.clear();
		this.addChild(this.speakerText);
		this.speakerText.text = speech.speaker;

		this.speakerBackgorund.beginFill(Colors.PURPLE);
		this.speakerBackgorund.lineStyle(4, Colors.BLACK);
		this.speakerBackgorund.drawPolygon([
				-300, -100,
				-280, -130,
				-270 + this.speakerText.width, -130,
				-250 + this.speakerText.width, -100
			]);

		if (speech.portrait !== undefined) {
			this.addChild(this.portraitBackground);
			this.portrait = Sprite.fromFrame(speech.portrait);
			this.portrait.x = -290;
			this.portrait.y = -220;
			this.portrait.scale.x = 2;
			this.portrait.scale.y = 2;
			this.addChild(this.portrait);
		}
	}

	public hide(): void {
		this.removeChildren();
	}

	public skip(): void {
		this.text.text = this.targetText;
	}

	public get finished(): boolean {
		return this.text.text.length === this.targetText.length;
	}

	private prerender(): void {
		this.frameCounter++;
		if (this.frameCounter % 2 === 0 && this.text.text.length < this.targetText.length) {
			this.text.text = this.targetText.substring(0, this.text.text.length + 1);
		}
	}

	public renderWebGL(renderer: WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}

	public renderCanvas(renderer: CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}
}