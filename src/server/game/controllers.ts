"use strict";

import * as log      from "beautiful-log";

import * as ai       from "./ai";
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

	getAction(state: Game.Crawl.InProgressCrawlState, entity: Game.Crawl.CrawlEntity): Promise<Game.Crawl.Action> {
		return new Promise((resolve, reject) => {
			resolve(ai.getAction(state, entity));
		});
	}

	updateState(state: Game.Crawl.CensoredInProgressCrawlState): void {
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

	constructor(socket: SocketIO.Socket) {
		this.socket = socket;
		this.log = [];
	}

	getAction(state: Game.Crawl.InProgressCrawlState,
	          entity: Game.Crawl.CrawlEntity): Promise<Game.Crawl.Action> {
		log.logf("<yellow>W %s</yellow>", this.socket.id);
		return new Promise((resolve, reject) => {
			this.flushLog();
			this.socket.emit("go");
			this.socket.on("action", (action: Game.Crawl.Action) => {
				log.logf("<magenta>M %s</magenta>", this.socket.id);
				if (executer.isValidAction(state, entity, action)) {
					this.socket.removeAllListeners("action");
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

	updateState(state: Game.Crawl.CensoredInProgressCrawlState): void {
		this.flushLog();
		this.socket.emit("update", state);
	}

	wait(): void {
		this.flushLog();
	}

	flushLog(): void {
		if (this.log.length > 0) {
			this.socket.emit("events", this.log);
			this.log = [];
		}
	}

	init(entity: Game.Crawl.UnplacedCrawlEntity): void {
		this.socket.emit("init", entity.id);
	}
}