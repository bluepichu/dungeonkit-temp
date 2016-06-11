"use strict";

import {MiniMap}      from "./minimap";
import {GameSocket}   from "./game-socket";
import {DungeonLayer} from "./dungeon-layer";

export class InputHandler {
	public awaitingMove: boolean;

	private minimap: MiniMap;
	private inputTimer: number;
	private moveInput: number;
	private socket: GameSocket;
	private dungeonLayer: DungeonLayer;

	constructor(socket: GameSocket, minimap: MiniMap, dungeonLayer: DungeonLayer) {
		this.awaitingMove = false;
		this.inputTimer = 0;
		this.moveInput = 0;
		this.minimap = minimap;
		this.dungeonLayer = dungeonLayer;
		this.socket = socket;
	}

	public handleInput(state: Game.Client.CensoredClientCrawlState): void {
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
						direction: this.dungeonLayer.getEntityDirection(state.self.id),
						attack: state.self.attacks[0]
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
					this.dungeonLayer.entityLayer.setEntityAnimation(state.self.id, "idle", dir as number);
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