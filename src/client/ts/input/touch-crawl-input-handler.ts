"use strict";

import AttackOverlay   from "../attack-overlay";
import CommandArea     from "../command-area";
import DungeonRenderer from "../dungeon-renderer";
import GameSocket      from "../game-socket";
import isMobile        from "../is-mobile";
import Messages        from "../messages";
import MessageLog      from "../message-log";
import Minimap         from "../minimap";
import * as state      from "../state";
import * as utils      from "../../../common/utils";

export default class TouchCrawlInputHandler implements CrawlInputHandler {
	public awaitingMove: boolean;

	private moveInput: number;
	private socket: GameSocket;
	private dungeonRenderer: DungeonRenderer;
	private hammer: HammerManager;
	private messageLog: MessageLog;
	private touchIndicator: TouchIndicator;
	private touchIndicatorAngle: number;

	constructor(socket: GameSocket,
			dungeonRenderer: DungeonRenderer,
			messageLog: MessageLog,
			rootElem: HTMLElement,
			gameContainer: PIXI.Container) {
		this.awaitingMove = false;
		this.moveInput = 0;
		this.dungeonRenderer = dungeonRenderer;
		this.socket = socket;
		this.messageLog = messageLog;
		this.touchIndicator = new TouchIndicator();

		gameContainer.addChild(this.touchIndicator);

		if (isMobile()) {
			this.setTouchListeners(rootElem);
		}
	}

	private setTouchListeners(rootElem: HTMLElement): void {
		this.hammer = new Hammer(rootElem, {
			preventDefault: true,
			recognizers: [
				[Hammer.Swipe, { event: "swipe", pointers: 1 }],
				[Hammer.Swipe, { event: "double-swipe", pointers: 2 }],
				[Hammer.Tap, { event: "triple-tap", pointers: 3 }],
				[Hammer.Tap, { event: "quadruple-tap", pointers: 4 }],
				[Hammer.Press, { event: "press", time: 200 }]
			]
		});

		this.hammer.on("swipe double-swipe triple-tap quadruple-tap press", (event) => console.log(event));

		this.hammer.on("swipe", (event) => {
			if (this.awaitingMove) {
				this.socket.sendAction({
					type: "move",
					direction: (8 - Math.round(event.angle / 45)) % 8
				}, {
						dash: false
					});
			};
		});

		this.hammer.on("double-swipe", (event) => {
			if (this.awaitingMove) {
				this.socket.sendAction({
					type: "move",
					direction: (8 - Math.round(event.angle / 45)) % 8
				}, {
						dash: true
					});
			}
		});

		this.hammer.on("triple-tap", (event) =>
			this.socket.emitTempSignal("start"));

		this.hammer.on("quadruple-tap", (event) =>
			this.messageLog.push(Messages.CONTROLS, 15000));

		this.hammer.on("press", (event) => {
			// if (this.awaitingMove) {
			// 	this.socket.sendAction({
			// 		type: "stairs"
			// 	});
			// }

			[this.touchIndicator.x, this.touchIndicator.y] = [event.center.x, event.center.y];
			this.touchIndicator.active = true;
		});

		this.hammer.on("pressup", (event) => {
			// if (this.awaitingMove) {
			// 	this.socket.sendAction({
			// 		type: "stairs"
			// 	});
			// }

			this.touchIndicator.active = false;
		});
	}

	public handleInput(): void { }
}

class TouchIndicator extends PIXI.Graphics {
	private angle: number;
	private _active: boolean;

	constructor() {
		super();
		this.angle = 0;
	}

	get active(): boolean {
		return this._active;
	}

	set active(active: boolean) {
		if (this._active !== active) {
			this.angle = 0;
			this._active = active;
		}
	}

	private prerender(): void {
		this.clear();

		if (this.active) {
			if (this.angle >= 2 * Math.PI) {
				this.beginFill(0xFFFFFF, .8);
				this.drawCircle(0, 0, 40);
				this.endFill();

				this.lineStyle(10, 0xFFFFFF, .8);
				this.drawCircle(0, 0, 60);
				this.lineStyle(0);
			} else {
				this.angle += Math.PI / 12;

				this.beginFill(0xFFFFFF, .4);
				this.drawCircle(0, 0, 40);
				this.endFill();

				this.lineStyle(10, 0xFFFFFF, .4);
				this.arc(0, 0, 60, -Math.PI / 2, -Math.PI / 2 + this.angle);
				this.lineStyle(0);
			}
		}
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