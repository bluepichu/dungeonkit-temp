"use strict";

import * as Colors   from "./colors";
import {GameSocket}  from "./game-socket";
import * as Messages from "./messages";
import {MessageLog}  from "./message-log";

const COMMAND_AREA_INACTIVE_STYLE = {
	font: "300 16px Hind Siliguri",
	fill: Colors.GRAY_4
};

const COMMAND_AREA_ACTIVE_STYLE = {
	font: "300 16px Hind Siliguri",
	fill: Colors.WHITE
};

const COMMAND_AREA_DEFAULT_TEXT = "Press space to input a command...";

const INVALID_COMMAND = "<command>%s</command> is not a valid command.";

export class CommandArea extends PIXI.Container {
	private _active: boolean;
	private background: PIXI.Graphics;
	private textInput: PIXI.Text;
	private buffer: string;
	private inputPromptFlashFrameCount: number;
	private socket: GameSocket;
	private messageLog: MessageLog;

	constructor(width: number, height: number, socket: GameSocket, messageLog: MessageLog) {
		super();

		this.background = new PIXI.Graphics();
		this.background.beginFill(0x666666);
		this.background.drawRect(0, 0, width, height);
		this.background.endFill();

		this.textInput = new PIXI.Text(COMMAND_AREA_DEFAULT_TEXT);
		this.textInput.x = 8;
		this.textInput.y = 8;
		this.textInput.resolution = window.devicePixelRatio;

		this.addChild(this.background);
		this.addChild(this.textInput);

		this.socket = socket;

		this.messageLog = messageLog;

		this.active = false;

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
				event.stopImmediatePropagation();
			}
			return;
		}

		switch (event.key) {
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
				if (event.key.length === 1) {
					this.buffer += event.key;
				}
				break;
		}

		this.inputPromptFlashFrameCount = 0;
		event.stopImmediatePropagation();
	}

	enter(): void {
		let command = this.buffer;

		switch (command) {
			case "start":
				this.socket.emitTempSignal("start");
				break;

			case "s":
			case "stairs":
				this.socket.sendAction({
					type: "stairs"
				});
				break;

			case "help":
				this.messageLog.push(Messages.CONTROLS, 15000);
				break;

			default:
				this.messageLog.push(sprintf(INVALID_COMMAND, command));
				break;
		}
	}

	prerender(): void {
		this.inputPromptFlashFrameCount++;
		this.inputPromptFlashFrameCount %= 60;

		this.textInput.text = this.buffer + (this.active && this.inputPromptFlashFrameCount < 30 ? "|" : "");
	}

	renderCanvas(renderer: PIXI.CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	renderWebGL(renderer: PIXI.WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}
}