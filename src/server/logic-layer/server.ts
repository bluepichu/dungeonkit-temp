"use strict";

import * as crawl   from "./crawl";
import dungeons     from "../data/dungeons";
import * as printer from "./printer";
import * as utils   from "../../common/utils";

import * as kue     from "kue";
import * as nconf   from "nconf";
import * as redis   from "redis";
import * as shortid from "shortid";

nconf.argv().env();

const log = require("beautiful-log")("dungeonkit:logic-server", { showDelta: false });
const redisClient = redis.createClient({ host: nconf.get("redis-host") || "127.0.0.1", port: nconf.get("redis-port") || 6379 });

const games: Map<string, CrawlState> = new Map<string, CrawlState>();
let queue: kue.Queue;

const names = ["Oran", "Pecha", "Rawst", "Cheri", "Chesto", "Sitrus"];
let self: string;

export function start(q: kue.Queue): void {
	register(() => {
		log(`Logic server "${self}" is up`);
		queue = q;

		queue.process(`in:${self}`, 2, (job: kue.Job, done: () => void) => {
			log("<-------- in");
			let { socketId, message } = job.data;
			receive(socketId, message, () => {
				// log throughput
				done();
			});
		});
	});
}

function register(callback: () => void): void {
	redisClient.zrange("dk:logic", 0, -1, (err: Error, keys: string[]) => {
		let candidates = names.filter((name) => keys.indexOf(name) < 0);

		if (candidates.length > 0) {
			self = candidates[0];
		} else {
			self = shortid.generate();
		}

		redisClient.zadd("dk:logic", 0, self, (err: Error, added: number) => {
			if (added > 0) {
				callback();
			} else {
				register(callback); // Name was taken, try again
			}
		});;
	});
}

function receive(socketId: string, message: InMessage, callback: () => void): void {
	switch (message.type) {
		case "crawl-start":
			handleCrawlStart(socketId, message.dungeon, message.entity, callback);
			break;

		case "crawl-action":
			handleCrawlAction(socketId, message.action, message.options, callback);
			break;

		case "disconnect":
			handleDisconnect(socketId, callback);
			break;
	}
}

function send(socketId: string, state: CrawlState, eventLog: LogEvent[], mapUpdates: MapUpdate[], callback: () => void): void {
	if (utils.isCrawlOver(state)) {
		// Iunno
	} else {
		games.set(socketId, state);

		// log(newState);
		// printer.printState(newState);

		let self = state.entities.filter((ent) => !ent.ai)[0];

		let censored = crawl.getCensoredState(state, self);

		let update: UpdateMessage = {
			stateUpdate: {
				floor: {
					number: state.floor.number,
					mapUpdates
				},
				entities: censored.entities,
				items: censored.items,
				self: censored.self
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

		queue.create("out", message).save((err: Error) => {
			if (err) {
				log.error(err);
			} else {
				callback();
			}
		});
	}
}

function handleCrawlStart(socketId: string, dungeon: string, entity: UnplacedCrawlEntity, callback: () => void): void {
	redisClient.zincrby("dk:logic", [1, self]);
	let eventLog: LogEvent[] = [];
	let mapUpdates: MapUpdate[] = [];
	let state = crawl.startCrawl(dungeons.get(dungeon), [entity], eventLog, mapUpdates);

	if (utils.isCrawlOver(state)) {
		// What?
	} else {
		let newState = crawl.step(state, eventLog, mapUpdates);

		let oldMap: FloorMap = {
			width: state.floor.map.width,
			height: state.floor.map.height,
			grid: Array.from(new Array(state.floor.map.height), () => Array.from(new Array((state as InProgressCrawlState).floor.map.width), () => ({ type: DungeonTileType.UNKNOWN })))
		}

		send(socketId, newState, eventLog, mapUpdates, callback);
	}
}

function handleCrawlAction(socketId: string, action: Action, options: ActionOptions, callback: () => void): void {
	let state: InProgressCrawlState = games.get(socketId) as InProgressCrawlState;

	if (state === undefined) {
		// welp
		callback();
		return;
	}

	let self = state.entities.filter((ent) => !ent.ai)[0];

	if (action.type === "attack" && "attack" in action) {
		// Replace with the correct attack object
		(action as AttackAction).attack = self.attacks.filter((attack) => attack.name === (action as AttackAction).attack.name)[0];
	}

	let eventLog: LogEvent[] = [];
	let mapUpdates: MapUpdate[] = [];

	if (!crawl.isValidAction(state, self, action)) {
		queue.create("out", { socketId, message: { type: "crawl-action-invalid" }}).save((err: Error) => {
			if (err) {
				log.error(err);
			} else {
				callback();
			}
		});
		return;
	}

	let newState = crawl.stepWithAction(state, action, eventLog, mapUpdates);
	send(socketId, newState, eventLog, mapUpdates, callback);
}

function handleDisconnect(socketId: string, callback: () => void): void {
	games.delete(socketId);
	redisClient.zincrby("dk:logic", [-1, self]);
	callback();
}