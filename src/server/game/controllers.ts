"use strict";

import * as log                     from "beautiful-log";
import * as shortid                 from "shortid";

import * as ai                      from "./ai";
import * as crawl                   from "./crawl";
import { graphics, entityGraphics } from "../data/graphics";
import * as printer                 from "./printer";
import * as utils                   from "../../common/utils";

export class AIController implements Controller {
	await: boolean = false;
	attackTarget: CensoredCrawlEntity;
	moveTarget: CrawlLocation;

	getAction(state: CensoredEntityCrawlState, entity: CrawlEntity): Promise<Action> {
		return new Promise((resolve, reject) => {
			resolve(ai.getAction(state, entity, this));
		});
	}

	updateState(state: CensoredEntityCrawlState): void {
		// TODO
	}

	pushEvent(event: LogEvent): void {
		// TODO
	}

	wait(): void {
		// TODO
	}
}

export class SocketController implements Controller {
	await: boolean = true;
	socket: SocketIO.Socket;
	log: LogEvent[];
	lastMap: FloorMap;
	currentState: CensoredEntityCrawlState;
	flushTimeout: NodeJS.Timer;
	dashing: boolean;
	dashPattern: number;
	dashDirection: number;
	knownGraphics: Set<String>;
	awaitingState: boolean;
	entity: PlayerOverworldEntity;

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
		this.awaitingState = true;
	}

	getAction(state: CensoredEntityCrawlState,
	          entity: CrawlEntity): Promise<Action> {
		log.logf("<yellow>W %s</yellow>", this.socket.id);

		let pattern = 0;

		let loc = entity.location;

		for (let i = 0; i < 8; i++) {
			let [dr, dc] = utils.decodeDirection(i);

			pattern <<= 1;
			let [r, c] = [loc.r + dr, loc.c + dc];

			if (0 <= r && r < state.floor.map.height && 0 <= c && c < state.floor.map.width) {
				if (state.floor.map.grid[r][c].type === DungeonTileType.WALL) {
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

			let setListener = () => this.socket.once("crawl-action", (action: Action, options: ActionOptions) => {
				log.logf("<magenta>M %s</magenta>", this.socket.id);

				if (action.type === "attack" && "attack" in action) {
					// Replace with the correct attack object
					(action as AttackAction).attack = entity.attacks.filter((attack) => attack.name === (action as AttackAction).attack.name)[0];
				}

				if (crawl.isValidAction(state, entity, action)) {
					if (action.type === "move" && options.dash) {
						this.dashPattern = pattern;
						this.dashing = true;
						this.dashDirection = (action as MoveAction).direction;
					}

					resolve(action);
				} else {
					this.socket.emit("crawl-invalid");
					setListener();
				}
			});

			setListener();
		});
	}

	checkGraphics(key: string): void {
		if (!this.knownGraphics.has(key)) {
			this.socket.emit("graphics", key, graphics.get(key));
			log.ok("Added graphics", key);
			this.knownGraphics.add(key);
		}
	}

	checkEntityGraphics(key: string): void {
		if (!this.knownGraphics.has(key)) {
			this.socket.emit("entity-graphics", key, entityGraphics.get(key));
			log.ok("Added entity graphics", key);
			this.knownGraphics.add(key);
		}
	}

	pushEvent(event: LogEvent): void {
		if (event.type === "start") {
			this.lastMap = undefined;
			this.awaitingState = true;
		}

		if (event.type === "attack") {
			this.dashing = false;
		}

		this.checkEntityGraphics(event.entity.graphics);
		this.log.push(event);
	}

	updateState(state: CensoredEntityCrawlState): void {
		this.currentState = state;

		for (let item of this.currentState.items) {
			this.checkGraphics(item.graphics);
		}

		for (let item of this.currentState.self.items.bag.items) {
			this.checkGraphics(item.graphics);
		}

		for (let item of this.currentState.self.items.held.items) {
			this.checkGraphics(item.graphics);
		}

		for (let entity of this.currentState.entities) {
			this.checkEntityGraphics(entity.graphics);
		}

		if (this.awaitingState) {
			this.awaitingState = false;
			this.flushLog(false);
		} else {
			this.flushTimeout = setTimeout(() => this.flushLog(false), 50);
		}
	}

	wait(): void {
		this.flushLog(false);
	}

	flushLog(move: boolean): void {
		if (this.flushTimeout !== undefined) {
			clearTimeout(this.flushTimeout);
		}

		let mapUpdates: MapUpdate[] =
			this.currentState.floor.map.grid
				.map((row, r) =>
					row.map((tile, c) => {
						if (this.lastMap === undefined) {
							if (tile.type !== DungeonTileType.UNKNOWN) {
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

		let stateUpdate: StateUpdate = {
			entities: this.currentState.entities,
			items: this.currentState.items,
			floor: {
				number: this.currentState.floor.number,
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

		stateUpdate.entities.forEach((entity) => this.checkEntityGraphics(entity.graphics));

		let update: UpdateMessage = {
			stateUpdate,
			log: this.log,
			move
		};

		this.socket.emit("crawl-update", update);

		this.log = [];
	}

	initOverworld(entity: PlayerOverworldEntity, scene: OverworldScene): void {
		this.entity = entity;

		for (let obj of scene.background) {
			this.checkGraphics(obj.graphics);
		}

		for (let ent of scene.entities) {
			this.checkEntityGraphics(ent.graphics);
		}

		this.checkEntityGraphics(entity.graphics);

		let self: SelfOverworldEntity = {
			id: entity.id,
			graphics: entity.graphics,
			name: entity.name,
			stats: entity.stats,
			attacks: entity.attacks,
			items: entity.items,
			position: entity.position
		};

		this.socket.emit("overworld-init", {
			self,
			scene
		});

		this.socket.on("overworld-interact-entity", (id: string) => {
			log.logf("<magenta>I init %s</magenta>", this.socket.id);
			let entities = scene.entities.filter((ent) => ent.id === id);

			if (entities.length > 0 && entities[0].interact) {
				this.handleInteraction(entities[0].interact());
			} else {
				log.logf("<magenta>I end %s</magenta>", this.socket.id);
				this.socket.emit("overworld-interact-end");
			}
		});

		this.socket.on("overworld-interact-hotzone", (id: string) => {
			log.logf("<magenta>I init hz %s</magenta>", this.socket.id);
			let hotzones = scene.hotzones.filter((hz) => hz.id === id);

			if (hotzones.length > 0 && hotzones[0].interact) {
				this.handleInteraction(hotzones[0].interact());
			} else {
				log.logf("<magenta>I end hz %s</magenta>", this.socket.id);
				this.socket.emit("overworld-interact-end");
			}
		});
	}

	handleInteraction(interaction: IterableIterator<Interaction>): void {
		let advance = ({ value, done }: IteratorResult<Interaction>) => {
			if (!value) {
				this.socket.emit("overworld-interact-end");
				return;
			}

			switch (value.type) {
				case "speak":
					log.logf("<magenta>I continue %s</magenta>", this.socket.id);
					this.socket.emit("overworld-interact-continue", value);

					this.socket.once("overworld-respond", (response: ClientInteractionResponse) => {
						log.logf("<magenta>I respond %s</magenta>", this.socket.id);
						if (done) {
							log.logf("<magenta>I end (no more speech) %s</magenta>", this.socket.id);
							this.socket.emit("overworld-interact-end");
						} else {
							advance(interaction.next(response));
						}
					})
					break;

				case "crawl":
					log.logf("<magenta>I end (dungeon) %s</magenta>", this.socket.id);
					this.socket.emit("overworld-interact-end");
					crawl.startCrawl(value.dungeon, [{
						id: this.entity.id,
						graphics: this.entity.graphics,
						name: this.entity.name,
						stats: this.entity.stats,
						attacks: this.entity.attacks,
						items: this.entity.items,
						controller: this.entity.controller,
						alignment: 1,
						advances: true
					}]);
					break;

				case "transition":
					this.socket.emit("overworld-interact-end");
					this.entity.position = value.start.position;
					this.initOverworld(this.entity, value.scene);
			}
		};

		advance(interaction.next());
	}

	initCrawl(entity: UnplacedCrawlEntity, dungeon: CensoredDungeon): void {
		this.checkGraphics(dungeon.graphics);
		this.socket.emit("crawl-init", dungeon);
	}
}