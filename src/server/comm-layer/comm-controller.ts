"use strict";

import * as RedisSMQ from "rsmq";

import { graphics, entityGraphics } from "../data/graphics";

const log  = require("beautiful-log")("dungeonkit:comm-controller");
const rsmq = new RedisSMQ({ host: "127.0.0.1", port: 6379, ns: "rsmq" });

export default class CommController {
	private entity: PlayerOverworldEntity;
	private socket: SocketIO.Socket;
	private knownGraphics: Set<String>;

	public constructor(socket: SocketIO.Socket, entity: PlayerOverworldEntity) {
		this.entity = entity;
		this.socket = socket;
		this.knownGraphics = new Set<String>();
	}

	public initOverworld(scene: OverworldScene): void {
		for (let obj of scene.background) {
			this.checkGraphics(obj.graphics);
		}

		for (let ent of scene.entities) {
			this.checkEntityGraphics(ent.graphics);
		}

		this.checkEntityGraphics(this.entity.graphics);

		let self: SelfOverworldEntity = {
			id: this.entity.id,
			graphics: this.entity.graphics,
			name: this.entity.name,
			stats: this.entity.stats,
			attacks: this.entity.attacks,
			items: this.entity.items,
			position: this.entity.position,
			direction: this.entity.direction
		};

		this.socket.emit("overworld-init", {
			self,
			scene
		});

		this.socket.removeAllListeners("overworld-interact-entity");
		this.socket.removeAllListeners("overworld-interact-hotzone");

		this.socket.on("overworld-interact-entity", (id: string) => {
			log(`I ent ${this.socket.id}`);
			let entities = scene.entities.filter((ent) => ent.id === id);

			if (entities.length > 0 && entities[0].interact) {
				this.handleInteraction(entities[0].interact());
			} else {
				log(`I end ${this.socket.id}`);
				this.socket.emit("overworld-interact-end");
			}
		});

		this.socket.on("overworld-interact-hotzone", (id: string) => {
			log(`I hz ${this.socket.id}`);
			let hotzones = scene.hotzones.filter((hz) => hz.id === id);

			if (hotzones.length > 0 && hotzones[0].interact) {
				this.handleInteraction(hotzones[0].interact());
			} else {
				log(`I end ${this.socket.id}`);
				this.socket.emit("overworld-interact-end");
			}
		});
	}

	private handleInteraction(interaction: IterableIterator<Interaction>): void {
		let advance = ({ value, done }: IteratorResult<Interaction>) => {
			if (!value) {
				this.socket.emit("overworld-interact-end");
				return;
			}

			switch (value.type) {
				case "speak":
					log(`I cont ${this.socket.id}`);
					this.socket.emit("overworld-interact-continue", value);

					this.socket.once("overworld-respond", (response: ClientInteractionResponse) => {
						log(`I res ${this.socket.id}`);
						if (done) {
							log(`I end ${this.socket.id}`);
							this.socket.emit("overworld-interact-end");
						} else {
							advance(interaction.next(response));
						}
					})
					break;

				case "crawl":
					log(`I end ${this.socket.id}`);
					this.initCrawl(value.dungeon);
					break;

				case "transition":
					this.socket.emit("overworld-interact-end");
					this.entity.position = value.start.position;
					this.initOverworld(value.scene);
					break;
			}
		};

		advance(interaction.next());
	}

	private checkGraphics(key: string): void {
		if (!this.knownGraphics.has(key)) {
			this.socket.emit("graphics", key, graphics.get(key));
			log(`G gen/${key} ${this.socket.id}`);
			this.knownGraphics.add(key);
		}
	}

	private checkEntityGraphics(key: string): void {
		if (!this.knownGraphics.has(key)) {
			this.socket.emit("entity-graphics", key, entityGraphics.get(key));
			log(`G ent/${key} ${this.socket.id}`);
			this.knownGraphics.add(key);
		}
	}

	private initCrawl(dungeon: Dungeon): void {
		this.checkGraphics(dungeon.graphics);
		this.socket.emit("crawl-init", dungeon);
		this.send({
			type: "crawl-start",
			dungeon,
			entity: {
				id: this.entity.id,
				name: this.entity.name,
				graphics: this.entity.graphics,
				stats: this.entity.stats,
				attacks: this.entity.attacks,
				items: this.entity.items,
				alignment: 1,
				ai: false
			}
		});
	}

	private handleGetAction(update: UpdateMessage): void {
		log(`W ${this.socket.id}`);

		update.stateUpdate.items.forEach((item) => this.checkGraphics(item.graphics));
		update.stateUpdate.self.items.bag.items.forEach((item) => this.checkGraphics(item.graphics));
		update.stateUpdate.self.items.held.items.forEach((item) => this.checkGraphics(item.graphics));
		update.stateUpdate.entities.forEach((ent) => this.checkEntityGraphics(ent.graphics));

		this.socket.emit("crawl-update", update);

		this.waitOnAction();
	}

	private handleInvalid(): void {
		this.socket.emit("crawl-invalid");

		this.waitOnAction();
	}

	private waitOnAction(): void {
		this.socket.once("crawl-action", (action: Action, options: ActionOptions) => {
			log(`M ${this.socket.id}`);

			this.send({
				type: "crawl-action",
				action,
				options
			});
		});
	}

	private send(message: InMessage): void {
		let msg: WrappedInMessage = {
			socketId: this.socket.id,
			message
		};

		log("--------> in");

		rsmq.sendMessage({ qname: "in", message: JSON.stringify(msg) }, (err, resp) => {
			if (err) {
				log.error(err);
			}
		});
	}

	public receive(message: OutMessage): void {
		switch (message.type) {
			case "crawl-get-action":
				this.handleGetAction(message.update);
				break;

			case "crawl-action-invalid":
				this.handleInvalid();
				break;
		}
	}
}