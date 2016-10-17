"use strict";

import {AttackOverlay}   from "./attack-overlay";
import {CommandArea}     from "./command-area";
import {DungeonRenderer} from "./dungeon-renderer";
import {GameSocket}      from "./game-socket";
import {isMobile}        from "./is-mobile";
import * as Messages     from "./messages";
import {MessageLog}      from "./message-log";
import {Minimap}         from "./minimap";
import * as state        from "./state";
import * as utils        from "../../common/utils";

export interface InputHandler {
	awaitingMove: boolean;

	handleInput(): void;
}

const DIRECTION_INPUT_DELAY = 4;

const KEYS = {
	B: 66,
	M: 77,
	R: 82,
	SHIFT: 16,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	ONE: 49,
	TWO: 50,
	THREE: 51,
	FOUR: 52
};

export class KeyboardInputHandler implements InputHandler {
	public awaitingMove: boolean;

	private minimap: Minimap;
	private commandArea: CommandArea;
	private socket: GameSocket;
	private dungeonRenderer: DungeonRenderer;
	private attackOverlay: AttackOverlay;
	private direction: number;
	private delay: number;

	constructor(
		socket: GameSocket,
		commandArea: CommandArea,
		minimap: Minimap,
		dungeonRenderer: DungeonRenderer,
		attackOverlay: AttackOverlay) {
		this.awaitingMove = false;
		this.minimap = minimap;
		this.dungeonRenderer = dungeonRenderer;
		this.socket = socket;
		this.commandArea = commandArea;
		this.attackOverlay = attackOverlay;

		document.addEventListener("keydown", (event) => this.commandArea.keypress(event));
	}

	public handleInput(): void {
		if (this.commandArea.active) {
			return;
		}

		this.dungeonRenderer.zoomOut = key.isPressed(KEYS.M);
		this.attackOverlay.active = key.isPressed(KEYS.SHIFT);

		if (this.awaitingMove && key.isPressed(KEYS.SHIFT)) {
			let attack: Attack = undefined;

			if (key.isPressed(KEYS.ONE)) {
				attack = state.getState().self.attacks[0];
			} else if (key.isPressed(KEYS.TWO)) {
				attack = state.getState().self.attacks[1];
			} else if (key.isPressed(KEYS.THREE)) {
				attack = state.getState().self.attacks[2];
			} else if (key.isPressed(KEYS.FOUR)) {
				attack = state.getState().self.attacks[3];
			}

			if (attack !== undefined) {
				this.awaitingMove = false;

				this.socket.sendAction({
					type: "attack",
					attack,
					direction: this.direction
				});
			}
		} else if (!key.isPressed(KEYS.LEFT)
				&& !key.isPressed(KEYS.RIGHT)
				&& !key.isPressed(KEYS.UP)
				&& !key.isPressed(KEYS.DOWN)) {
			this.delay = DIRECTION_INPUT_DELAY;
		} else {
			this.delay--;

			if (this.delay <= 0) {
				let direction = this.getDirection();

				if (direction !== undefined) {
					this.direction = direction;

					if (this.awaitingMove) {
						this.dungeonRenderer
						.entityLayer
						.setObjectDirection(state.getState().self.id, this.direction);

						if (!key.isPressed(KEYS.R)) {
							this.awaitingMove = false;
							this.socket.sendAction({
								type: "move",
								direction: this.direction
							}, {
								dash: key.isPressed(KEYS.B)
							});
						}
					}
				}
			}
		}
	}

	private getDirection(): number | undefined {
		let input = 0;

		if (key.isPressed(KEYS.LEFT)) {
			input |= 0b0010;
		}

		if (key.isPressed(KEYS.UP)) {
			input |= 0b0100;
		}

		if (key.isPressed(KEYS.RIGHT)) {
			input |= 0b1000;
		}

		if (key.isPressed(KEYS.DOWN)) {
			input |= 0b0001;
		}

		return ({
			[0b1000]: 0,
			[0b1100]: 1,
			[0b0100]: 2,
			[0b0110]: 3,
			[0b0010]: 4,
			[0b0011]: 5,
			[0b0001]: 6,
			[0b1001]: 7
		} as {[key: number]: number})[input];
	}
}

export class TouchInputHandler implements InputHandler {
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