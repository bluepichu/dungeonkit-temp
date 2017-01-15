"use strict";

import AttackOverlay   from "../attack-overlay";
import CommandArea     from "../command-area";
import DungeonRenderer from "../dungeon-renderer";
import GameSocket      from "../game-socket";
import isMobile        from "../is-mobile";
import * as Messages   from "../messages";
import MessageLog      from "../message-log";
import Minimap         from "../minimap";
import * as state      from "../state";
import * as utils      from "../../../common/utils";

const KEYS = {
	B: 66,
	M: 77,
	R: 82,
	W: 87,
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

const DIRECTION_INPUT_DELAY = 4;

export default class KeyboardCrawlInputHandler implements CrawlInputHandler {
	public awaitingMove: boolean;

	private commandArea: CommandArea;
	private socket: GameSocket;
	private direction: number;
	private delay: number;

	public minimap: Minimap;
	public dungeonRenderer: DungeonRenderer;
	public attackOverlay: AttackOverlay;

	constructor(
			socket: GameSocket,
			commandArea: CommandArea) {
		this.awaitingMove = false;
		this.socket = socket;
		this.commandArea = commandArea;
		this.direction = 6;

		document.addEventListener("keydown", (event) => this.commandArea.keypress(event));
	}

	public handleInput(): void {
		if (this.commandArea.active) {
			return;
		}

		if (this.dungeonRenderer !== undefined) {
			this.dungeonRenderer.zoomOut = key.isPressed(KEYS.M);
		}

		if (this.attackOverlay !== undefined) {
			this.attackOverlay.active = key.isPressed(KEYS.SHIFT);
		}

		if (this.awaitingMove && key.isPressed(KEYS.W)) {
			this.awaitingMove = false;

			this.socket.sendAction({
				type: "wait"
			});
		} else if (this.awaitingMove && key.isPressed(KEYS.SHIFT)) {
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
					this.direction = direction as number;

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

	private getDirection(): number | void {
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