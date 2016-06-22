"use strict";

import {AnimatedSprite}                                        from "./graphics/animated-sprite";
import {AttackOverlay}                                         from "./attack-overlay";
import * as Colors                                             from "./colors";
import {CommandArea}                                           from "./command-area";
import * as Constants                                          from "./constants";
import {DungeonLayer}                                          from "./dungeon-layer";
import * as Messages                                           from "./messages";
import {EntityLayer}                                           from "./entity-layer";
import {EntitySprite}                                          from "./graphics/entity-sprite";
import {GameSocket}                                            from "./game-socket";
import {GroundLayer}                                           from "./ground-layer";
import {KeyboardInputHandler, TouchInputHandler, InputHandler} from "./input-handler";
import {isMobile}                                              from "./is-mobile";
import {MessageLog}                                            from "./message-log";
import {MiniMap}                                               from "./minimap";
import * as state                                              from "./state";
import {TweenHandler}                                          from "./tween-handler";
import * as utils                                              from "../../common/utils";

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
let floorSignText: PIXI.Text = undefined;
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
				.add("ent-eevee", "/assets/eevee.json")
				.once("complete", init);

			PIXI.loader.load();
		}
	});
});

key.filter = (event: KeyboardEvent) => commandArea ? commandArea.active : false;

function init() {
	socket = new GameSocket();

	socket.onInit((dungeon: Game.Crawl.CensoredDungeon) => {
		console.info("init");

		state.setState({
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
		});
	});

	socket.onInvalid(() => {
		console.info("invalid");
		inputHandler.awaitingMove = true;
	});

	socket.onGraphics((key: string, graphics: Game.Graphics.EntityGraphics) => {
		EntityLayer.entityGraphicsCache.set(key, graphics);
	});

	socket.onUpdate(({stateUpdate, log, move}: Game.Client.UpdateMessage) => {
		let updates: Processable[] = log;

		console.info("update");

		if (stateUpdate !== undefined) {
			updates.push({ type: "done", move, state: stateUpdate });

			if (state.getState().self === undefined) {
				state.getState().self = stateUpdate.self; // required for the very first step
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
	let main: HTMLElement = document.getElementsByTagName("main")[0] as HTMLElement;
	main.appendChild(renderer.view);

	tweenHandler = new TweenHandler();

	dungeonLayer = new DungeonLayer(tweenHandler);
	dungeonLayer.x = window.innerWidth / 2;
	dungeonLayer.y = window.innerHeight / 2;
	gameContainer.addChild(dungeonLayer);

	minimap = new MiniMap(300, 200);
	minimap.x = 50;
	minimap.y = 50;
	// gameContainer.addChild(minimap);

	messageLog = new MessageLog(tweenHandler);
	messageLog.x = window.innerWidth;
	messageLog.y = window.innerHeight;
	gameContainer.addChild(messageLog);

	floorSign = new PIXI.Container();
	floorSign.alpha = 0;
	gameContainer.addChild(floorSign);

	let g = new PIXI.Graphics();
	g.beginFill(0x000000);
	g.drawRect(0, 0, window.innerWidth, window.innerHeight);
	g.endFill();
	floorSign.addChild(g);

	floorSignText = new PIXI.Text("", {
		font: "300 32px Hind Siliguri",
		fill: Colors.WHITE,
		align: "center"
	});
	floorSignText.anchor.x = .5;
	floorSignText.anchor.y = .5;
	floorSignText.x = window.innerWidth / 2;
	floorSignText.y = window.innerHeight / 2;
	floorSignText.resolution = window.devicePixelRatio;
	floorSign.addChild(floorSignText);

	requestAnimationFrame(animate);

	commandArea = new CommandArea(300, 36, socket, messageLog);
	commandArea.x = window.innerWidth - 350;
	commandArea.y = 50;

	if (!isMobile()) {
		inputHandler = new KeyboardInputHandler(socket, minimap, dungeonLayer);
		gameContainer.addChild(commandArea);
		if (window.location.pathname !== "/") {
			socket.emitTempSignal("join", window.location.pathname.substring(1));
		}
	} else {
		inputHandler = new TouchInputHandler(socket, dungeonLayer, messageLog, main, gameContainer);
		if (window.location.pathname !== "/mobile") {
			socket.emitTempSignal("join", window.location.pathname.substring(7));
		}
	}

	window.addEventListener("orientationchange", handleWindowResize);
	window.addEventListener("resize", handleWindowResize);

	messageLog.push(Messages.WELCOME, 10000);
	messageLog.push(Messages.START_HELP, 10000);
}

function handleWindowResize(): void {
	renderer.view.style.width = window.innerWidth + "px";
	renderer.view.style.height = window.innerHeight + "px";

	renderer.resize(window.innerWidth, window.innerHeight);

	messageLog.x = window.innerWidth;
	messageLog.y = window.innerHeight;

	commandArea.x = window.innerWidth - 350;

	floorSignText.x = window.innerWidth / 2;
	floorSignText.y = window.innerHeight / 2;

	dungeonLayer.x = window.innerWidth / 2;
	dungeonLayer.y = window.innerHeight / 2;
}

function processAll(updates: Processable[]): void {
	processChain = processChain
		.then(() => console.warn("starting chain", updates))
		.then(() => getResolutionPromise(updates))
		.then(() => console.warn("finished chain"));
}

function getResolutionPromise(processes: Processable[]): Promise<void> {
	console.log(processes.map(p => p.type));

	return new Promise<void>((resolve, reject) => {
		if (processes.length === 0) {
			resolve();
			return;
		}

		let proc = processes.shift();

		let done = () =>
			resolve(getResolutionPromise(processes));

		switch (proc.type) {
			case "done":
				console.log("done");
				let doneEvent = proc as { type: "done", move: boolean, state: Game.Client.StateUpdate };

				doneEvent.state.floor.mapUpdates.forEach((update) => {
					state.getState().floor.map.grid[update.location.r][update.location.c] = update.tile;
					dungeonLayer.groundLayer.update(update.location);
				});

				state.getState().entities = doneEvent.state.entities;
				state.getState().self = doneEvent.state.self;

				dungeonLayer.updatePosition(state.getState().self.location);
				dungeonLayer.entityLayer.update();
				minimap.update();

				inputHandler.awaitingMove = inputHandler.awaitingMove || doneEvent.move;

				return done();

			case "start":
				let startEvent = proc as Game.Crawl.StartLogEvent;

				state.getState().floor.number = startEvent.floorInformation.number;
				state.getState().floor.map.width = startEvent.floorInformation.width;
				state.getState().floor.map.height = startEvent.floorInformation.height;

				state.getState().floor.map.grid =
					utils.tabulate((row) =>
						utils.tabulate((col) =>
							({ type: Game.Crawl.DungeonTileType.UNKNOWN }),
							startEvent.floorInformation.width),
						startEvent.floorInformation.height);

				state.getState().self = startEvent.self;

				floorSignText.text = sprintf("%s\n%s%dF",
					state.getState().dungeon.name,
					state.getState().dungeon.direction === "down" ? "B" : "",
					state.getState().floor.number);

				dungeonLayer.init();

				new Promise((resolve, _) => setTimeout(resolve, 2000))
					.then(() => {
						done();
						setTimeout(() => tweenHandler.tween(floorSign, "alpha", 0, .1), 400);
					});

				break;

			case "wait":
				setTimeout(done, 200);
				break;

			case "move":
				let getMovePromise = (evt: Game.Crawl.MoveLogEvent) =>
					dungeonLayer.moveEntity(
						evt.entity,
						evt.start,
						evt.end,
						evt.entity.id === state.getState().self.id,
						"walk",
						evt.direction)
						.then(() => dungeonLayer.entityLayer.setEntityAnimation(evt.entity.id, "idle"));

				let movePromises: Thenable[] = [];
				let deferred: Processable[] = [];

				processes.unshift(proc);

				while (processes.length > 0) {
					if (processes[0].type === "move") {
						movePromises.push(getMovePromise(processes.shift() as Game.Crawl.MoveLogEvent));
					} else if (processes[0].type === "done") {
						deferred.push(processes.shift());
					} else {
						break;
					}
				}

				processes = deferred.concat(processes);

				Promise.all(movePromises).then(done);
				break;

			case "attack":
				let attackEvent = proc as Game.Crawl.AttackLogEvent;

				messageLog.push(sprintf("<%1$s>%2$s</%1$s> used <attack>%3$s</attack>!",
					attackEvent.entity.id === state.getState().self.id ? "self" : "enemy",
					attackEvent.entity.name,
					attackEvent.attack.name));

				dungeonLayer.showAnimationOnce(attackEvent.entity.id, attackEvent.attack.animation, attackEvent.direction)
					.then(() => dungeonLayer.entityLayer.setEntityAnimation(attackEvent.entity.id, "idle"))
					.then(done);

				break;

			case "stat":
				let statEvent = proc as Game.Crawl.StatLogEvent;

				switch (statEvent.stat) {
					case "hp":
						messageLog.push(sprintf("<%1$s>%2$s</%1$s> took %3$d damage!",
							statEvent.entity.id === state.getState().self.id ? "self" : "enemy",
							statEvent.entity.name,
							-statEvent.change));

						dungeonLayer.entityLayer.setEntityAnimation(statEvent.entity.id, "hurt");

						new Promise((resolve, _) => setTimeout(resolve, 1000))
							.then(() => dungeonLayer.entityLayer.setEntityAnimation(statEvent.entity.id, "idle"))
							.then(done);
						break;

					default:
						done();
						break;
				}
				break;

			case "defeat":
				let defeatEvent = proc as Game.Crawl.DefeatLogEvent;

				messageLog.push(sprintf("<%1$s>%2$s</%1$s> was defeated!",
					defeatEvent.entity.id === state.getState().self.id ? "self" : "enemy",
					defeatEvent.entity.name));
				dungeonLayer.entityLayer.setEntityAnimation(defeatEvent.entity.id, "defeat");
				new Promise((resolve, _) => setTimeout(resolve, 500))
					.then(done);
				break;

			case "stairs":
				let stairsEvent = proc as Game.Crawl.StairsLogEvent;

				messageLog.push(sprintf("<%1$s>%2$s</%1$s> went up the stairs!",
					stairsEvent.entity.id === state.getState().self.id ? "self" : "enemy",
					stairsEvent.entity.name));
				new Promise((resolve, _) => setTimeout(resolve, 600))
					.then(() => tweenHandler.tween(floorSign, "alpha", 1, .1))
					.then(() => {
						minimap.clear();
						dungeonLayer.clear();
						messageLog.clear();
						setTimeout(done, 1000);
					});

				break;
		}
	});
}

function animate() {
	inputHandler.handleInput();
	tweenHandler.step();
	renderer.render(gameContainer);
	requestAnimationFrame(animate);
}