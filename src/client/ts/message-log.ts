"use strict";

import * as Colors    from "./colors";
import {TweenHandler} from "./tween-handler";

const MESSAGE_LOG_STYLES: { [key: string]: PIXI.TextStyle } = {
	def: {
		font: "300 16px Lato",
		fill: Colors.WHITE,
		align: "right"
	},
	self: {
		font: "300 16px Lato",
		fill: Colors.YELLOW,
		align: "right"
	},
	ally: {
		font: "300 16px Lato",
		fill: Colors.ORANGE,
		align: "right"
	},
	enemy: {
		font: "300 16px Lato",
		fill: Colors.RED,
		align: "right"
	},
	item: {
		font: "300 16px Lato",
		fill: Colors.BLUE,
		align: "right"
	},
	command: {
		font: "300 16px Lato",
		fill: Colors.PURPLE,
		align: "right"
	},
	attack: {
		font: "300 16px Lato",
		fill: Colors.BROWN,
		align: "right"
	}
};

export class MessageLog extends PIXI.Container {
	private messages: PIXI.Container[];
	private timeouts: number[];
	private keepTime: number;
	private spacing: number;
	private maximumHeight: number;
	private tweenHandler: TweenHandler;

	constructor(tweenHandler: TweenHandler) {
		super();
		this.messages = [];
		this.timeouts = [];

		this.spacing = 40;
		this.keepTime = 5000;
		this.maximumHeight = 400;
		this.tweenHandler = tweenHandler;
	}

	push(message: string, timeout?: number): void {
		let msg = this.createMessage(message);
		this.addChild(msg);
		msg.x = -12;
		msg.y = msg.height + 12;

		this.messages.unshift(msg);

		this.repositionMessages();
		this.timeouts.unshift(setTimeout((() => this.pop(msg)) as any,
			timeout !== undefined ? timeout : this.keepTime));
	}

	private repositionMessages() {
		let height = 0;
		let i = 0;

		for (; i < this.messages.length; i++) {
			let message = this.messages[i];
			height += 12;

			if (height + message.height > this.maximumHeight) {
				break;
			}

			this.tweenHandler.tween(message, "x", -12, 1.1, "smooth");
			this.tweenHandler.tween(message, "y", -height, 1.1, "smooth");

			height += message.height;
		}

		for (let j = this.messages.length - 1; j >= i; j--) {
			this.pop(this.messages[j]);
		}
	}

	pop(messageToRemove: PIXI.Container): void {
		if (this.messages.length === 0) {
			return;
		}

		let index = this.messages.indexOf(messageToRemove);

		if (index === -1) {
			return;
		}

		clearTimeout(this.timeouts[index]);
		this.messages.splice(index, 1);
		this.timeouts.splice(index, 1);

		this.tweenHandler.tween(messageToRemove, "x", Math.max(messageToRemove.width + 100, 400), 1.1, "smooth")
			.then(() => {
				this.removeChild(messageToRemove);
				this.repositionMessages();
			});
	}

	createMessage(message: string): PIXI.Container {
		let ret = new PIXI.Container();

		let text = new PIXI.MultiStyleText(message, MESSAGE_LOG_STYLES);
		text.anchor.x = 1;
		text.anchor.y = 1;
		text.resolution = window.devicePixelRatio;

		let bg = new PIXI.Graphics();

		bg.beginFill(Colors.BLACK, .8);
		bg.drawRect(-text.width - 8, -text.height - 8, text.width + 16, text.height + 16);
		bg.endFill();

		ret.addChild(bg);
		ret.addChild(text);

		return ret;
	}

	clear() {
		this.timeouts.forEach((timeout) => clearTimeout(timeout));
		this.timeouts = [];
		this.messages = [];
		this.removeChildren();
	}
}