"use strict";

import {
	CanvasRenderer,
	Container,
	Graphics,
	Text,
	TextStyleOptions,
	WebGLRenderer
} from "pixi.js";

import MultiStyleText, { TextStyleSet } from "pixi-multistyle-text";

import Colors     from "./colors";
import GameSocket from "./game-socket";
import Messages   from "./messages";
import MessageLog from "./message-log";

const COMMAND_AREA_INACTIVE_STYLE: TextStyleOptions = {
	fontFamily: "Lato",
	fontSize: "16px",
	fontWeight: "300",
	fill: Colors.GRAY_5
};

const COMMAND_AREA_ACTIVE_STYLE: TextStyleOptions = {
	fontFamily: "Lato",
	fontSize: "16px",
	fontWeight: "400",
	fill: Colors.WHITE
};

const COMMAND_AREA_SUGGESTION_STYLES: TextStyleSet = {
	default: {
		fontFamily: "Lato",
		fontSize: "14px",
		fontWeight: "400",
		fill: Colors.WHITE
	},
	item: {
		fill: Colors.BLUE
	},
	minor: {
		fill: Colors.GRAY_5
	}
};

const COMMAND_AREA_DESCRIPTION_STYLES: TextStyleSet = {
	default: {
		fontFamily: "Lato",
		fontSize: "10px",
		fontWeight: "400",
		fill: Colors.WHITE,
		wordWrap: true,
		wordWrapWidth: 240
	},
	item: {
		fill: Colors.BLUE
	}
};

const COMMAND_AREA_DEFAULT_TEXT = "Press space to input a command...";

interface Handler {
	label: string;
	description: string;
	handler(): any;
}

export default class CommandArea extends Container {
	public onInvalid: (cmd: string) => any;

	private _active: boolean;
	private background: Graphics;
	private textInput: Text;
	private suggestions: Suggestion[];
	private buffer: string;
	private inputPromptFlashFrameCount: number;
	private handlers: { [key: string]: Handler };
	private highlighted: number;

	constructor() {
		super();

		this.background = new Graphics();
		this.background.beginFill(0x666666);
		this.background.drawRect(0, 0, 300, 36);
		this.background.endFill();

		this.textInput = new Text(COMMAND_AREA_DEFAULT_TEXT);
		this.textInput.x = 8;
		this.textInput.y = 8;

		this.addChild(this.background);
		this.addChild(this.textInput);

		this.active = false;
		this.handlers = {};
		this.suggestions = [];
		this.highlighted = 0;

		document.addEventListener("keydown", (event) => this.keypress(event));
	}

	get active(): boolean {
		return this._active;
	}

	set active(active: boolean) {
		this._active = active;

		if (active) {
			this.textInput.style = COMMAND_AREA_ACTIVE_STYLE as PIXI.TextStyle;
			this.buffer = "";
			this.inputPromptFlashFrameCount = 0;
			this.highlighted = 0;
		} else {
			this.textInput.style = COMMAND_AREA_INACTIVE_STYLE as PIXI.TextStyle;
			this.buffer = COMMAND_AREA_DEFAULT_TEXT;
		}
	}

	keypress(event: KeyboardEvent): void {
		event.preventDefault();
		event.stopImmediatePropagation();

		if (!this.active) {
			if (event.key === " ") {
				this.active = true;
				this.resetSuggestions();
				event.stopImmediatePropagation();
			}
			return;
		}

		switch (event.key) {
			case "ArrowDown":
				this.suggestions[this.highlighted].highlighted = false;
				this.highlighted++;
				this.highlighted = Math.min(this.highlighted, this.suggestions.length - 1);
				this.suggestions[this.highlighted].highlighted = true;
				this.repositionSuggestions();
				return;

			case "ArrowUp":
				this.suggestions[this.highlighted].highlighted = false;
				this.highlighted--;
				this.highlighted = Math.max(this.highlighted, 0);
				this.suggestions[this.highlighted].highlighted = true;
				this.repositionSuggestions();
				return;

			case "Enter":
				this.enter();
				this.active = false;
				break;

			case "Escape":
				this.active = false;
				break;

			case "Backspace":
				if (this.buffer.length > 0) {
					this.buffer = this.buffer.slice(0, -1);
				}
				break;

			default:
				this.highlighted = 0;
				if (event.key.length === 1) {
					this.buffer += event.key;
				}
				break;
		}

		this.resetSuggestions();
		this.inputPromptFlashFrameCount = 0;
	}

	enter(): void {
		let command = this.suggestions.length > 0
			? this.suggestions[this.highlighted].value
			: this.buffer.toLowerCase();

		if (command in this.handlers) {
			this.handlers[command].handler();
		} else if (this.onInvalid) {
			this.onInvalid(`<command>${command}</command> is not a valid command.`);
		}
	}

	prerender(): void {
		this.inputPromptFlashFrameCount++;
		this.inputPromptFlashFrameCount %= 60;

		this.textInput.text = this.buffer + (this.active && this.inputPromptFlashFrameCount < 30 ? "|" : "");
	}

	private repositionSuggestions() {
		let y = 36;

		this.suggestions.forEach((suggestion, index) => {
			suggestion.y = y;
			y += suggestion.height;
		});
	}

	renderCanvas(renderer: CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	renderWebGL(renderer: WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}

	public clearHandlers(): void {
		this.handlers = {};
	}

	public addHandler(command: string, handler: Handler): void {
		this.handlers[command.toLowerCase()] = handler;
	}

	public resetSuggestions(): void {
		this.suggestions.forEach((suggestion) => this.removeChild(suggestion));
		this.suggestions = [];

		Object.keys(this.handlers)
			.map((suggestion) => ({
				score: scoreSuggestion(this.buffer.toLowerCase(), suggestion.toLowerCase()),
				suggestion,
				label: this.handlers[suggestion].label,
				description: this.handlers[suggestion].description
			}))
			.filter((suggestion) => suggestion.score > 0)
			.sort((a, b) => b.score - a.score)
			.forEach((obj, index) => {
				let suggestion = new Suggestion(obj.label, obj.description, obj.suggestion);
				suggestion.highlighted = index === 0;
				this.addChild(suggestion);
				suggestion.x = 20;
				this.suggestions.push(suggestion);
			});

		this.repositionSuggestions();
	}
}

function scoreSuggestion(input: string, suggestion: string): number {
	let index = 0;
	let difference = 0;
	let score = 1 / suggestion.length;
	for (let character of input) {
		while (index < suggestion.length && suggestion.charAt(index) !== character) {
			index++;
			difference++;
		}
		if (index === suggestion.length) {
			return 0;
		}
		score += 100 - difference;
		difference = 0;
	}
	return score;
}

class Suggestion extends Container {
	private background: Graphics;
	private text: MultiStyleText;
	private desc: MultiStyleText;
	private _value: string;

	constructor(label: string, description: string, value: string) {
		super();

		this.background = new Graphics();
		this.addChild(this.background);

		this.text = new MultiStyleText(label, COMMAND_AREA_SUGGESTION_STYLES);
		this.text.x = 12;
		this.text.y = 6;
		this.addChild(this.text);

		this.desc = new MultiStyleText(description, COMMAND_AREA_DESCRIPTION_STYLES);
		this.desc.x = 18;
		this.desc.y = 28;
		this.addChild(this.desc);

		this.highlighted = false;
		this._value = value;
	}

	public set highlighted(highlighted: boolean) {
		this.background.clear();
		this.background.beginFill(highlighted ? Colors.GRAY_2 : Colors.GRAY_1);
		this.background.lineStyle(0);
		this.background.drawRect(0, 0, 280, highlighted ? 36 + this.desc.height : 28);
		this.desc.visible = highlighted;
	}

	public get value() {
		return this._value;
	}
}