"use strict";

import * as log      from "beautiful-log";
import * as shortid  from "shortid";

import * as ai       from "./ai";
import * as crawl    from "./crawl";
import * as executer from "./executer";
import { graphics }  from "./graphics";
import * as printer  from "./printer";
import * as utils    from "../../common/utils";

export class AIController implements Game.Crawl.Controller {
	await: boolean = false;
	attackTarget: Game.Crawl.CensoredCrawlEntity;
	moveTarget: Game.Crawl.Location;

	constructor() {
	}

	getAction(state: Game.Crawl.CensoredEntityCrawlState, entity: Game.Crawl.CrawlEntity): Promise<Game.Crawl.Action> {
		return new Promise((resolve, reject) => {
			resolve(ai.getAction(state, entity, this));
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

	init(entity: Game.Crawl.UnplacedCrawlEntity, dungeon: Game.Crawl.CensoredDungeon): void {
		// TODO
	}
}

export class SocketController implements Game.Crawl.Controller {
	await: boolean = true;
	socket: SocketIO.Socket;
	log: Game.Crawl.LogEvent[];
	lastMap: Game.Crawl.Map;
	currentState: Game.Crawl.CensoredEntityCrawlState;
	flushTimeout: NodeJS.Timer;
	dashing: boolean;
	dashPattern: number;
	dashDirection: number;
	knownGraphics: Set<String>;

	constructor(socket: SocketIO.Socket) {
		this.socket = socket;
		this.log = [];
		this.lastMap = undefined;
		this.currentState = undefined;
		this.flushTimeout = undefined;
		this.dashing = false;
		this.dashPattern = 0;
		this.dashDirection = 0;
		this.knownGraphics = new Set();
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
				if (state.floor.map.grid[r][c].type === Game.Crawl.DungeonTileType.WALL) {
					pattern |= 1;
				}
			} else {
				pattern |= 1;
			}
		}

		if (this.dashing && this.dashPattern === pattern) {
			this.flushLog(false);
			return new Promise((resolve, _) => setTimeout(resolve, 0))
				.then(() => ({ type: "move" as "move", direction: this.dashDirection }));
		}

		this.dashing = false;

		return new Promise((resolve, reject) => {
			this.currentState = state;
			this.flushLog(true);
			this.socket.on("action", (action: Game.Crawl.Action, options: Game.Client.ActionOptions) => {
				log.logf("<magenta>M %s</magenta>", this.socket.id);
				if (executer.isValidAction(state, entity, action)) {
					this.socket.removeAllListeners("action");

					if (action.type === "move" && options.dash) {
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

	checkGraphics(key: string): void {
		if (!this.knownGraphics.has(key)) {
			this.socket.emit("graphics", key, graphics.get(key));
			log.ok("Added graphics", key);
			this.knownGraphics.add(key);
		}
	}

	pushEvent(event: Game.Crawl.LogEvent): void {
		if (event.type === "start") {
			this.lastMap = undefined;
		}

		this.checkGraphics(event.entity.graphics);
		this.log.push(event);
	}

	updateState(state: Game.Crawl.CensoredEntityCrawlState): void {
		this.currentState = state;
		this.flushTimeout = setTimeout(() => this.flushLog(false), 50);
	}

	wait(): void {
		this.flushLog(false);
	}

	flushLog(move: boolean): void {
		if (this.flushTimeout !== undefined) {
			clearTimeout(this.flushTimeout);
		}

		let mapUpdates: Game.Client.MapUpdate[] =
			this.currentState.floor.map.grid
				.map((row, r) =>
					row.map((tile, c) => {
						if (this.lastMap === undefined) {
							if (tile.type !== Game.Crawl.DungeonTileType.UNKNOWN) {
								return { location: { r, c }, tile };
							}
						} else if (tile.type !== utils.getTile(this.lastMap, { r, c }).type
							|| tile.roomId !== utils.getTile(this.lastMap, { r, c }).roomId
							|| tile.stairs !== utils.getTile(this.lastMap, { r, c }).stairs) {
							return { location: { r, c }, tile };
						}
						return undefined;
					}))
				.reduce((acc, row) => acc.concat(row), [])
				.filter((update) => update !== undefined);

		this.lastMap = {
			width: this.currentState.floor.map.width,
			height: this.currentState.floor.map.height,
			grid: this.currentState.floor.map.grid.map((row) => row.map((tile) => Object.assign({}, tile)))
		};

		let stateUpdate: Game.Client.StateUpdate = {
			entities: this.currentState.entities,
			floor: {
				number: this.currentState.floor.number,
				items: this.currentState.floor.items,
				mapUpdates
			},
			self: {
				name: this.currentState.self.name,
				location: this.currentState.self.location,
				graphics: this.currentState.self.graphics,
				id: this.currentState.self.id,
				attacks: this.currentState.self.attacks,
				stats: this.currentState.self.stats,
				alignment: this.currentState.self.alignment,
				advances: this.currentState.self.advances,
				items: this.currentState.self.items
			}
		};

		stateUpdate.entities.forEach((entity) => this.checkGraphics(entity.graphics));

		let update: Game.Client.UpdateMessage = {
			stateUpdate,
			log: this.log,
			move
		};

		this.socket.emit("update", update);

		this.log = [];
	}

	init(entity: Game.Crawl.UnplacedCrawlEntity, dungeon: Game.Crawl.CensoredDungeon): void {
		this.socket.emit("init", dungeon);
	}
}