"use strict";

import {
	Container,
	Graphics,
	TextStyle
} from "pixi.js";

import Colors         from "./colors";
import * as Tweener   from "./graphics/tweener";
import MultiStyleText from "./pixi-multistyle-text";

const MESSAGE_LOG_STYLES: { [key: string]: TextStyle } = {
	def: {
		fontFamily: "Lato",
		fontSize: "16px",
		fontWeight: "300",
		fill: Colors.WHITE,
		align: "right"
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

export default class MessageLog extends Container {
	private messages: Container[];
	private timeouts: number[];
	private keepTime: number;
	private spacing: number;
	private maximumHeight: number;

	constructor() {
		super();
		this.messages = [];
		this.timeouts = [];

		this.spacing = 40;
		this.keepTime = 5000;
		this.maximumHeight = 400;
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

			Tweener.tween(message, { x: -12, y: -height }, 1.1, "smooth");

			height += message.height;
		}

		for (let j = this.messages.length - 1; j >= i; j--) {
			this.pop(this.messages[j]);
		}
	}

	pop(messageToRemove: Container): void {
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

		Tweener.tween(messageToRemove, { x: Math.max(messageToRemove.width + 100, 400) }, 1.1, "smooth")
			.then(() => {
				this.removeChild(messageToRemove);
				this.repositionMessages();
			});
	}

	createMessage(message: string): Container {
		let ret = new Container();

		let text = new MultiStyleText(message, MESSAGE_LOG_STYLES);
		text.anchor.x = 1;
		text.anchor.y = 1;
		text.resolution = window.devicePixelRatio;

		let bg = new Graphics();

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