"use strict";

import {
	CanvasRenderer,
	Container,
	Graphics,
	Text,
	TextStyle,
	WebGLRenderer
} from "pixi.js";

import Colors         from "./colors";
import GameSocket     from "./game-socket";
import Messages       from "./messages";
import MessageLog     from "./message-log";
import MultiStyleText from "./pixi-multistyle-text";

const COMMAND_AREA_INACTIVE_STYLE: TextStyle = {
	fontFamily: "Lato",
	fontSize: "16px",
	fontWeight: "300",
	fill: Colors.GRAY_5
};

const COMMAND_AREA_ACTIVE_STYLE: TextStyle = {
	fontFamily: "Lato",
	fontSize: "16px",
	fontWeight: "400",
	fill: Colors.WHITE
};

const COMMAND_AREA_SUGGESTION_STYLES: { [key: string]: TextStyle } = {
	def: {
		fontFamily: "Lato",
		fontSize: "14px",
		fontWeight: "400",
		fill: Colors.WHITE
	},
	item: {
		fill: Colors.BLUE
	}
};

const COMMAND_AREA_DEFAULT_TEXT = "Press space to input a command...";

const INVALID_COMMAND = "<command>%s</command> is not a valid command.";

type Handler = {
	label: string;
	handler(socket: GameSocket, messageLog: MessageLog): void;
};

export default class CommandArea extends Container {
	private _active: boolean;
	private background: Graphics;
	private textInput: Text;
	private suggestions: Suggestion[];
	private buffer: string;
	private inputPromptFlashFrameCount: number;
	private socket: GameSocket;
	private messageLog: MessageLog;
	private handlers: { [key: string]: Handler };
	private highlighted: number;

	constructor(socket: GameSocket, messageLog: MessageLog) {
		super();

		this.background = new Graphics();
		this.background.beginFill(0x666666);
		this.background.drawRect(0, 0, 300, 36);
		this.background.endFill();

		this.textInput = new Text(COMMAND_AREA_DEFAULT_TEXT);
		this.textInput.x = 8;
		this.textInput.y = 8;
		this.textInput.resolution = window.devicePixelRatio;

		this.addChild(this.background);
		this.addChild(this.textInput);

		this.socket = socket;
		this.messageLog = messageLog;
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
			this.textInput.style = COMMAND_AREA_ACTIVE_STYLE;
			this.buffer = "";
			this.inputPromptFlashFrameCount = 0;
			this.highlighted = 0;
		} else {
			this.textInput.style = COMMAND_AREA_INACTIVE_STYLE;
			this.buffer = COMMAND_AREA_DEFAULT_TEXT;
		}
	}

	keypress(event: KeyboardEvent): void {
		event.preventDefault();

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
				this.highlighted++;
				this.highlighted = Math.min(this.highlighted, this.suggestions.length - 1);
				break;

			case "ArrowUp":
				this.highlighted--;
				this.highlighted = Math.max(this.highlighted, 0);
				break;

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
		event.stopImmediatePropagation();
	}

	enter(): void {
		let command = this.suggestions.length > 0
			? this.suggestions[this.highlighted].value
			: this.buffer.toLowerCase();

		if (command in this.handlers) {
			this.handlers[command].handler(this.socket, this.messageLog);
		} else {
			this.messageLog.push(sprintf(INVALID_COMMAND, command));
		}
	}

	prerender(): void {
		this.inputPromptFlashFrameCount++;
		this.inputPromptFlashFrameCount %= 60;

		this.textInput.text = this.buffer + (this.active && this.inputPromptFlashFrameCount < 30 ? "|" : "");
		this.suggestions.forEach((suggestion, index) => suggestion.highlighted = index === this.highlighted);
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
				label: this.handlers[suggestion].label
			}))
			.filter((suggestion) => suggestion.score > 0)
			.sort((a, b) => b.score - a.score)
			.forEach((obj, index) => {
				let suggestion = new Suggestion(obj.label, obj.suggestion);
				suggestion.x = 20;
				suggestion.y = 36 + 24 * index;
				this.addChild(suggestion);
				this.suggestions.push(suggestion);
			});
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
	private _value: string;

	constructor(label: string, value: string) {
		super();

		this.background = new Graphics();
		this.addChild(this.background);

		this.text = new MultiStyleText(label, COMMAND_AREA_SUGGESTION_STYLES);
		this.text.x = 12;
		this.text.y = 4;
		this.text.resolution = window.devicePixelRatio;
		this.addChild(this.text);

		this.highlighted = false;
		this._value = value;
	}

	public set highlighted(highlighted: boolean) {
		this.background.beginFill(highlighted ? Colors.GRAY_2 : Colors.GRAY_1);
		this.background.drawRect(0, 0, 280, 24);
	}

	public get value() {
		return this._value;
	}
}