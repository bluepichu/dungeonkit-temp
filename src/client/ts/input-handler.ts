"use strict";

import {AttackOverlay} from "./attack-overlay";
import {CommandArea}   from "./command-area";
import {DungeonLayer}  from "./dungeon-layer";
import {GameSocket}    from "./game-socket";
import {isMobile}      from "./is-mobile";
import * as Messages   from "./messages";
import {MessageLog}    from "./message-log";
import {Minimap}       from "./minimap";
import * as state      from "./state";
import * as utils      from "../../common/utils";

export interface InputHandler {
	awaitingMove: boolean;

	handleInput(): void;
}

export class KeyboardInputHandler implements InputHandler {
	public awaitingMove: boolean;

	private minimap: Minimap;
	private inputTimer: number;
	private moveInput: number;
	private commandArea: CommandArea;
	private socket: GameSocket;
	private dungeonLayer: DungeonLayer;
	private attackOverlay: AttackOverlay;

	constructor(
		socket: GameSocket,
		commandArea: CommandArea,
		minimap: Minimap,
		dungeonLayer: DungeonLayer,
		attackOverlay: AttackOverlay) {
		this.awaitingMove = false;
		this.inputTimer = 0;
		this.moveInput = 0;
		this.minimap = minimap;
		this.dungeonLayer = dungeonLayer;
		this.socket = socket;
		this.commandArea = commandArea;
		this.attackOverlay = attackOverlay;

		document.addEventListener("keydown", (event) => this.commandArea.keypress(event));
	}

	public handleInput(): void {
		if (this.commandArea.active) {
			return;
		}

		this.dungeonLayer.zoomOut = key.isPressed(77);
		this.attackOverlay.active = key.isPressed(16);

		if (this.awaitingMove) {
			if (key.shift) {
				let move = 0;
				if (key.isPressed(49)) {
					move = 1;
				} else if (key.isPressed(50)) {
					move = 2;
				} else if (key.isPressed(51)) {
					move = 3;
				} else if (key.isPressed(52)) {
					move = 4;
				}

				if (move > 0) {
					this.awaitingMove = false;

					this.socket.sendAction({
						type: "attack",
						direction: this.dungeonLayer.getEntityDirection(state.getState().self.id),
						attack: state.getState().self.attacks[move - 1]
					});
				}

				return;
			}

			if (key.isPressed(37) || key.isPressed(38) || key.isPressed(39) || key.isPressed(40)) {
				this.awaitingMove = false;
				this.moveInput = 0;
				this.inputTimer = 4;
			}
		}

		if (this.inputTimer > 0) {
			if (key.isPressed(82)) {
				this.moveInput |= 0b10000;
			}

			if (key.isPressed(37)) {
				this.moveInput |= 0b01000;
			}

			if (key.isPressed(38)) {
				this.moveInput |= 0b00100;
			}

			if (key.isPressed(39)) {
				this.moveInput |= 0b00010;
			}

			if (key.isPressed(40)) {
				this.moveInput |= 0b00001;
			}

			this.inputTimer--;

			if (this.inputTimer === 0) {
				let rot = (this.moveInput & 0b10000) > 0;
				let dir = inputToDirection(this.moveInput & 0b1111);

				if (dir !== undefined) {
					this.dungeonLayer.entityLayer.setEntityAnimation(state.getState().self.id, "default", dir as number);
					if (rot) {
						this.awaitingMove = true;
					} else {
						this.socket.sendAction({
							type: "move",
							direction: dir as number
						}, {
								dash: key.isPressed(66)
							});
					}
				} else {
					this.awaitingMove = true;
				}
			}
		}
	}
}

export class TouchInputHandler implements InputHandler {
	public awaitingMove: boolean;

	private moveInput: number;
	private socket: GameSocket;
	private dungeonLayer: DungeonLayer;
	private hammer: HammerManager;
	private messageLog: MessageLog;
	private touchIndicator: TouchIndicator;
	private touchIndicatorAngle: number;

	constructor(socket: GameSocket,
			dungeonLayer: DungeonLayer,
			messageLog: MessageLog,
			rootElem: HTMLElement,
			gameContainer: PIXI.Container) {
		this.awaitingMove = false;
		this.moveInput = 0;
		this.dungeonLayer = dungeonLayer;
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

function inputToDirection(input: number): number | void {
	switch (input) {
		case 0b0010:
			return 0;

		case 0b0110:
			return 1;

		case 0b0100:
			return 2;

		case 0b1100:
			return 3;

		case 0b1000:
			return 4;

		case 0b1001:
			return 5;

		case 0b0001:
			return 6;

		case 0b0011:
			return 7;

		default:
			return undefined;
	}
}