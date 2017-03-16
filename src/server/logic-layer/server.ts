"use strict";

import * as crawl      from "./crawl";
import * as printer    from "./printer";
import * as utils      from "../../common/utils";


import * as clone      from "clone";
import * as redis      from "redis";
import * as RedisSMQ   from "rsmq";
import * as RSMQWorker from "rsmq-worker";

const log = require("beautiful-log")("dungeonkit:logic-server", { showDelta: false });
const rsmq = new RedisSMQ({ host: "127.0.0.1", port: 6379, ns: "rsmq" });
const client = redis.createClient();

export function start(): void {
	log("Logic server is up");

	const worker = new RSMQWorker("in", { interval: 0 });

	worker.on("message", (msg: string, next: () => void, id: number) => {
		log("<-------- in");
		let { socketId, message }: WrappedInMessage = JSON.parse(msg);
		receive(socketId, message, next);
	});

	worker.start();
}

function receive(socketId: string, message: InMessage, callback: () => void): void {
	switch (message.type) {
		case "crawl-start":
			handleCrawlStart(socketId, message.dungeon, message.entity, callback);
			break;

		case "crawl-action":
			handleCrawlAction(socketId, message.action, message.options, callback);
			break;
	}
}

function send(socketId: string, oldMap: FloorMap, newState: CrawlState, eventLog: LogEvent[], callback: () => void): void {
	if (utils.isCrawlOver(newState)) {
		// Iunno
	} else {
		client.set("game_" + socketId, JSON.stringify(newState));

		// log(newState);
		// printer.printState(newState);

		let newSelf = newState.entities.filter((ent) => !ent.ai)[0];

		let mapUpdates = newSelf.map.grid
				.map((row, r) =>
					row.map((tile, c) => {
						let t = utils.getTile(oldMap, {r, c});
						if (tile.type !== t.type || tile.roomId !== t.roomId || tile.stairs !== t.stairs) {
							return { location: { r, c }, tile };
						} else {
							return undefined;
						}
					}))
				.reduce((acc, row) => acc.concat(row), [])
				.filter((update) => update !== undefined);

		let update: UpdateMessage = {
			stateUpdate: {
				floor: {
					number: newState.floor.number,
					mapUpdates
				},
				entities: newState.entities.filter((ent) => utils.isObjectVisible(newState.floor.map, newState.entities[0].location, ent.location)), // ewwwww
				items: newState.items.filter((item) => utils.isObjectVisible(newState.floor.map, newState.entities[0].location, item.location)), // ewwwww
				self: newSelf
			},
			log: eventLog,
			move: true
		};

		let message: WrappedOutMessage = {
			socketId,
			message: {
				type: "crawl-get-action",
				update
			}
		};

		rsmq.sendMessage({ qname: "out", message: JSON.stringify(message) }, (err, resp) => {
			if (err) {
				log.error(err);
			} else {
				callback();
			}
		});
	}
}

function handleCrawlStart(socketId: string, dungeon: Dungeon, entity: UnplacedCrawlEntity, callback: () => void): void {
	let eventLog: LogEvent[] = [];
	let state = crawl.startCrawl(dungeon, [entity], eventLog);

	if (utils.isCrawlOver(state)) {
		// What?
	} else {
		let newState = crawl.step(state, eventLog);

		let oldMap: FloorMap = {
			width: state.floor.map.width,
			height: state.floor.map.height,
			grid: Array.from(new Array(state.floor.map.height), () => Array.from(new Array((state as InProgressCrawlState).floor.map.width), () => ({ type: DungeonTileType.UNKNOWN })))
		}

		send(socketId, oldMap, newState, eventLog, callback);
	}
}

function handleCrawlAction(socketId: string, action: Action, options: ActionOptions, callback: () => void): void {
	client.get("game_" + socketId, (err, data) => {
		if (err) {
			log.error(err);
			return;
		}

		let state: InProgressCrawlState = JSON.parse(data);
		let self = state.entities.filter((ent) => !ent.ai)[0];

		if (action.type === "attack" && "attack" in action) {
			// Replace with the correct attack object
			(action as AttackAction).attack = self.attacks.filter((attack) => attack.name === (action as AttackAction).attack.name)[0];
		}

		let oldMap = clone(self.map);
		let eventLog: LogEvent[] = [];

		if (!crawl.isValidAction(state, self, action)) {
			rsmq.sendMessage({ qname: "out", message: JSON.stringify({ socketId, message: { type: "crawl-action-invalid" }})}, (err, resp) => {
				if (err) {
					log.error(err);
				} else {
					callback();
				}
			});
			return;
		}

		let newState = crawl.stepWithAction(state, action, eventLog);
		send(socketId, oldMap, newState, eventLog, callback);
	});
}