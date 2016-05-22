"use strict";

import * as log      from "beautiful-log";
import * as shortid  from "shortid";

import * as ai       from "./ai";
import * as crawl    from "./crawl";
import * as executer from "./executer";
import * as utils    from "./utils";

export class AIController implements Game.Crawl.Controller {
	await: boolean = false;
	goals: any;
	attr: string[];
	hit: boolean;

	constructor(attributes: string[]) {
		this.goals = {};
		this.attr = attributes;
	}

	getAction(state: Game.Crawl.CensoredEntityCrawlState, entity: Game.Crawl.CrawlEntity): Promise<Game.Crawl.Action> {
		return new Promise((resolve, reject) => {
			resolve(ai.getAction(state, entity));
		});
	}

	updateState(state: Game.Crawl.CensoredEntityCrawlState): void {
		// TODO
	}

	pushEvent(event: Game.Crawl.LogEvent): void {
		// TODO
	}

	wait(): void {
		// TODO
	}

	init(entity: Game.Crawl.UnplacedCrawlEntity): void {
		// TODO
	}
}

export class SocketController implements Game.Crawl.Controller {
	await: boolean = true;
	socket: SocketIO.Socket;
	log: Game.Crawl.LogEvent[];
	lastState: Game.Crawl.CensoredEntityCrawlState;
	dashing: boolean;
	dashPattern: number;
	dashDirection: number;

	constructor(socket: SocketIO.Socket) {
		this.socket = socket;
		this.log = [];
		this.lastState = undefined;
		this.dashing = false;
		this.dashPattern = 0;
		this.dashDirection = 0;
	}

	getAction(state: Game.Crawl.CensoredEntityCrawlState,
	          entity: Game.Crawl.CrawlEntity): Promise<Game.Crawl.Action> {
		log.logf("<yellow>W %s</yellow>", this.socket.id);

		let pattern = 0;

		let loc = entity.location;

		for (let i = 0; i < 8; i++) {
			let [dr, dc] = utils.decodeDirection(i);

			pattern <<= 1;
			let [r, c] = [loc.r + dr, loc.c + dc];

			if (0 <= r && r < state.floor.map.height && 0 <= c && c < state.floor.map.width) {
				if (state.floor.map.grid[r][c].type === "wall") {
					pattern |= 1;
				}
			} else {
				pattern |= 1;
			}
		}

		if (this.dashing && this.dashPattern === pattern) {
			return Promise.resolve({ type: "move" as "move", direction: this.dashDirection });
		}

		this.dashing = false;

		return new Promise((resolve, reject) => {
			this.flushLog(true, state);
			this.socket.on("action", (action: Game.Crawl.Action, options: Game.Crawl.ClientActionOptions) => {
				log.logf("<magenta>M %s</magenta>", this.socket.id);
				if (executer.isValidAction(state, entity, action)) {
					this.socket.removeAllListeners("action");

					if (options.dash && action.type === "move") {
						this.dashPattern = pattern;
						this.dashing = true;
						this.dashDirection = (action as Game.Crawl.MoveAction).direction;
					}

					resolve(action);
				} else {
					this.socket.emit("invalid");
				}
			});
		});
	}

	pushEvent(event: Game.Crawl.LogEvent): void {
		this.log.push(event);
	}

	updateState(state: Game.Crawl.CensoredEntityCrawlState): void {
		this.flushLog(false, state);
	}

	wait(): void {
		this.flushLog(false);
	}

	flushLog(move: boolean, state?: Game.Crawl.CensoredEntityCrawlState): void {
		let update: Game.Crawl.ClientUpdate = {
			state: state,
			log: this.log,
			move: move
		};

		log.log(update);

		this.socket.emit("update", update);

		this.lastState = state;
		this.log = [];
	}

	init(entity: Game.Crawl.UnplacedCrawlEntity): void {
		this.socket.emit("init", entity.id);
	}
}