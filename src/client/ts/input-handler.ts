"use strict";

import {DungeonLayer} from "./dungeon-layer";
import {GameSocket}   from "./game-socket";
import * as Messages  from "./messages";
import {MessageLog}   from "./message-log";
import {MiniMap}      from "./minimap";
import * as state     from "./state";
import * as utils     from "./utils";

export class InputHandler {
	public awaitingMove: boolean;

	private minimap: MiniMap;
	private inputTimer: number;
	private moveInput: number;
	private socket: GameSocket;
	private dungeonLayer: DungeonLayer;
	private hammer: HammerManager;
	private messageLog: MessageLog;

	constructor(socket: GameSocket, minimap: MiniMap, dungeonLayer: DungeonLayer, messageLog: MessageLog, rootElem: HTMLElement) {
		this.awaitingMove = false;
		this.inputTimer = 0;
		this.moveInput = 0;
		this.minimap = minimap;
		this.dungeonLayer = dungeonLayer;
		this.socket = socket;
		this.messageLog = messageLog;

		if (utils.isMobile()) {
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
				[Hammer.Rotate, { event: "rotate", threshold: 120 }],
				[Hammer.Press, { event: "press", time: 1000 }]
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

		let entityBaseDirection = 0;
		let startRotationAngle = 0;

		this.hammer.on("rotatestart", (event) => {
			entityBaseDirection = this.dungeonLayer.getEntityDirection(state.getState().self.id);
			startRotationAngle = event.rotation;
		});

		this.hammer.on("rotatemove", (event) =>
			this.dungeonLayer.entityLayer.setEntityAnimation(state.getState().self.id, "idle",
				(entityBaseDirection + 8 - Math.round((event.rotation - startRotationAngle) / 11.25)) % 8));

		this.hammer.on("press", (event) => {
			if (this.awaitingMove) {
				this.socket.sendAction({
					type: "stairs"
				});
			}
		});
	}

	public handleInput(): void {
		if (this.hammer === undefined) {
			if (key.isPressed(77)) {
				this.minimap.resize(600, 600);
			} else {
				this.minimap.resize(300, 200);
			}

			if (this.awaitingMove) {
				if (key.shift) {
					if (key.isPressed(49)) {
						this.awaitingMove = false;

						this.socket.sendAction({
							type: "attack",
							direction: this.dungeonLayer.getEntityDirection(state.getState().self.id),
							attack: state.getState().self.attacks[0]
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
					let dir = this.inputToDirection(this.moveInput & 0b1111);

					if (dir !== undefined) {
						this.dungeonLayer.entityLayer.setEntityAnimation(state.getState().self.id, "idle", dir as number);
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

	private inputToDirection(input: number): number | void {
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
}