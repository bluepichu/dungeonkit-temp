"use strict";

import {AnimatedSprite} from "./graphics/animated-sprite";
import {AttackOverlay}  from "./attack-overlay";
import * as Colors      from "./colors";
import {CommandArea}    from "./command-area";
import * as Constants   from "./constants";
import {DungeonLayer}   from "./dungeon-layer";
import {EntityLayer}    from "./entity-layer";
import {EntitySprite}   from "./graphics/entity-sprite";
import {GameSocket}     from "./game-socket";
import {GroundLayer}    from "./ground-layer";
import {InputHandler}   from "./input-handler";
import {MessageLog}     from "./message-log";
import {MiniMap}        from "./minimap";
import {TweenHandler}   from "./tween-handler";
import * as utils       from "./utils";

let renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer = undefined;
let gameContainer: PIXI.Container = undefined;
let socket: GameSocket = undefined;
let minimap: MiniMap = undefined;
let commandArea: CommandArea = undefined;
let dungeonLayer: DungeonLayer = undefined;
let messageLog: MessageLog = undefined;
let tweenHandler: TweenHandler = undefined;
let processChain: Thenable = Promise.resolve();
let floorSign: PIXI.Container = undefined;
let state: Game.Client.CensoredClientCrawlState = undefined;
let attackOverlay: AttackOverlay = undefined;
let inputHandler: InputHandler = undefined;

document.addEventListener("DOMContentLoaded", () => {
	WebFont.load({
		google: {
			families: ["Hind Siliguri:400, 300"]
		},
		active: () => {
			PIXI.loader
				.add("dng-proto", "/assets/tiles.json")
				.add("ent-mudkip", "/assets/mudkip.json")
				.once("complete", init);

			PIXI.loader.load();
		}
	});
});

key.filter = (event: KeyboardEvent) => commandArea ? commandArea.active : false;

function init() {
	socket = new GameSocket();

	socket.onInit((dungeon: Game.Crawl.CensoredDungeon) => {
		console.log("init");

		state = {
			dungeon,
			floor: {
				number: 0,
				map: {
					width: 0,
					height: 0,
					grid: []
				},
				items: []
			},
			entities: [],
			self: undefined
		};
	});

	socket.onInvalid(() => {
		console.log("invalid");
		inputHandler.awaitingMove = true;
	});

	socket.onGraphics((key: string, graphics: Game.Graphics.EntityGraphics) => {
		EntityLayer.entityGraphicsCache.set(key, graphics);
	});

	socket.onUpdate(({stateUpdate, log, move}: Game.Client.UpdateMessage) => {
		let updates: Processable[] = log;

		console.log("update");

		if (stateUpdate !== undefined) {
			updates.push({ type: "done", move, state: stateUpdate });

			if (state.self === undefined) {
				state.self = stateUpdate.self; // required for the very first step
			}
		}

		processAll(updates);
	});

	for (let name in PIXI.utils.TextureCache) {
		PIXI.utils.TextureCache[name].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	}

	let resolution = window.devicePixelRatio || 1;

	renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
		resolution: resolution,
		antialias: false
	});

	gameContainer = new PIXI.Container();
	document.getElementsByTagName("main")[0].appendChild(renderer.view);

	tweenHandler = new TweenHandler();

	dungeonLayer = new DungeonLayer(tweenHandler);
	dungeonLayer.x = window.innerWidth / 2;
	dungeonLayer.y = window.innerHeight / 2;
	gameContainer.addChild(dungeonLayer);

	minimap = new MiniMap(300, 200);
	minimap.x = 50;
	minimap.y = 50;
	gameContainer.addChild(minimap);

	messageLog = new MessageLog(tweenHandler);
	messageLog.x = window.innerWidth;
	messageLog.y = window.innerHeight;
	gameContainer.addChild(messageLog);

	commandArea = new CommandArea(300, 36, socket, messageLog);
	commandArea.x = window.innerWidth - 350;
	commandArea.y = 50;
	gameContainer.addChild(commandArea);

	floorSign = new PIXI.Container();
	floorSign.alpha = 0;
	gameContainer.addChild(floorSign);

	let g = new PIXI.Graphics();
	g.beginFill(0x000000);
	g.drawRect(0, 0, window.innerWidth, window.innerHeight);
	g.endFill();
	floorSign.addChild(g);

	let text = new PIXI.Text("Prototypical Forest\nB1F", {
		font: "300 32px Hind Siliguri",
		fill: Colors.WHITE,
		align: "center"
	});
	text.anchor.x = .5;
	text.anchor.y = .5;
	text.x = window.innerWidth / 2;
	text.y = window.innerHeight / 2;
	text.resolution = window.devicePixelRatio;
	floorSign.addChild(text);

	requestAnimationFrame(animate);

	inputHandler = new InputHandler(socket, minimap, dungeonLayer);

	messageLog.push("Welcome to <item>DungeonKit</item>!  Enter the command <command>start</command> to start.", 10000);
	messageLog.push("You can enter the command <command>help</command> at any time for an explanation of the controls.", 10000);
}

function processAll(updates: Processable[]): void {
	while (updates.length > 0) {
		processChain = processChain.then(getResolutionPromise(updates.shift()));
	}
}

function getResolutionPromise(proc: Processable): (value: any) => Promise<void> {
	return (value: any) => new Promise<void>((resolve, reject) => {
		console.log(proc);
		if (proc.type === "done") {
			let p = proc as { type: "done", move: boolean, state: Game.Client.StateUpdate };

			p.state.floor.mapUpdates.forEach((update) => {
				state.floor.map.grid[update.location.r][update.location.c] = update.tile;
				dungeonLayer.groundLayer.update(state, update.location);
			});

			state.entities = p.state.entities;
			state.self = p.state.self;

			dungeonLayer.entityLayer.update(state);
			minimap.update(state);

			inputHandler.awaitingMove = inputHandler.awaitingMove || p.move;

			resolve();
		} else {
			let event = proc as Game.Crawl.LogEvent;

			switch (event.type) {
				case "start":
					let startEvent = event as Game.Crawl.StartLogEvent;
					state.floor.number = startEvent.floorInformation.number;
					state.floor.map.width = startEvent.floorInformation.width;
					state.floor.map.height = startEvent.floorInformation.height;
					state.floor.map.grid =
						utils.tabulate((row) =>
							utils.tabulate((col) =>
								({ type: Game.Crawl.DungeonTileType.UNKNOWN }),
								startEvent.floorInformation.width),
							startEvent.floorInformation.height);
					state.self = startEvent.self;
					(floorSign.children[1] as PIXI.Text).text = sprintf("%s\n%s%dF",
						state.dungeon.name,
						state.dungeon.direction === "down" ? "B" : "",
						state.floor.number);
					dungeonLayer.init(state);
					new Promise((resolve, _) => setTimeout(resolve, 2000))
						.then(() => {
							resolve();
							setTimeout(() => tweenHandler.tween(floorSign, "alpha", 0, .1), 400);
						});
					break;

				case "wait":
					messageLog.push(sprintf("<%1$s>%2$s</%1$s> waits.",
							event.entity.id === state.self.id ? "self" : "enemy",
							event.entity.name));
					resolve();
					break;

				case "move":
					let moveEvent = event as Game.Crawl.MoveLogEvent;
					dungeonLayer.moveEntity(event.entity, moveEvent.start, moveEvent.end, event.entity.id === state.self.id, "walk", moveEvent.direction)
						.then(() => dungeonLayer.entityLayer.setEntityAnimation(moveEvent.entity.id, "idle"))
						.then(resolve);
					break;

				case "attack":
					let attackEvent = event as Game.Crawl.AttackLogEvent;
					messageLog.push(sprintf("<%1$s>%2$s</%1$s> used <attack>%3$s</attack>!",
							event.entity.id === state.self.id ? "self" : "enemy",
							event.entity.name,
							attackEvent.attack.name));
					dungeonLayer.showAnimationOnce(event.entity.id, attackEvent.attack.animation, attackEvent.direction)
						.then(() => dungeonLayer.entityLayer.setEntityAnimation(attackEvent.entity.id, "idle"))
						.then(resolve);
					break;

				case "stat":
					let statEvent = event as Game.Crawl.StatLogEvent;

					switch (statEvent.stat) {
						case "hp":
							messageLog.push(sprintf("<%1$s>%2$s</%1$s> took %3$d damage!",
									statEvent.entity.id === state.self.id ? "self" : "enemy",
									statEvent.entity.name,
									-statEvent.change));

							dungeonLayer.entityLayer.setEntityAnimation(statEvent.entity.id, "hurt");

							new Promise((resolve, _) => setTimeout(resolve, 1000))
								.then(() => dungeonLayer.entityLayer.setEntityAnimation(statEvent.entity.id, "idle"))
								.then(resolve);
							break;

						default:
							resolve();
					}
					break;

				case "defeat":
					messageLog.push(sprintf("<%1$s>%2$s</%1$s> was defeated!",
							event.entity.id === state.self.id ? "self" : "enemy",
							event.entity.name));
					dungeonLayer.entityLayer.setEntityAnimation(event.entity.id, "defeat");
					new Promise((resolve, _) => setTimeout(resolve, 500))
						.then(() => resolve());
					break;

				case "stairs":
					messageLog.push(sprintf("<%1$s>%2$s</%1$s> went up the stairs!",
							event.entity.id === state.self.id ? "self" : "enemy",
							event.entity.name));
					new Promise((resolve, _) => setTimeout(resolve, 600))
						.then(() => tweenHandler.tween(floorSign, "alpha", 1, .1))
						.then(() => {
							minimap.clear();
							dungeonLayer.clear();
							messageLog.clear();
							setTimeout(resolve, 1000);
						});
					break;
			}
		}
	});
}

function animate() {
	inputHandler.handleInput(state);
	tweenHandler.step();
	renderer.render(gameContainer);
	requestAnimationFrame(animate);
}