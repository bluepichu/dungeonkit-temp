"use strict";

import {
	autoDetectRenderer,
	CanvasRenderer,
	Container,
	Graphics,
	loader,
	SCALE_MODES,
	Text,
	ticker,
	utils as PixiUtils,
	WebGLRenderer
} from "pixi.js";

import AttackOverlay                from "./attack-overlay";
import Colors                       from "./colors";
import CommandArea                  from "./command-area";
import Constants                    from "./constants";
import DungeonRenderer              from "./dungeon-renderer";
import Messages                     from "./messages";
import EntityLayer                  from "./entity-layer";
import EntitySprite                 from "./graphics/entity-sprite";
import GameSocket                   from "./game-socket";
import * as GraphicsDescriptorCache from "./graphics/graphics-descriptor-cache";
import GraphicsObject               from "./graphics/graphics-object";
import isMobile                     from "./is-mobile";
import KeyboardInputHandler         from "./input/keyboard-input-handler";
import Keys                         from "./input/keys";
import MessageLog                   from "./message-log";
import Minimap                      from "./minimap";
import * as state                   from "./state";
import TeamOverlay                  from "./team-overlay";
import TouchCrawlInputHandler       from "./input/touch-crawl-input-handler";
import * as Tweener                 from "./graphics/tweener";
import * as utils                   from "../../common/utils";
import * as WebFont                 from "webfontloader";

const enum GamePhase {
	OVERWORLD,
	CRAWL,
	CUTSCENE
};

let renderer: WebGLRenderer | CanvasRenderer = undefined;
let gameContainer: Container = undefined;
let socket: GameSocket = undefined;
let minimap: Minimap = undefined;
let commandArea: CommandArea = undefined;
let dungeonRenderer: DungeonRenderer = undefined;
let messageLog: MessageLog = undefined;
let processChain: Thenable = Promise.resolve();
let floorSign: Container = undefined;
let floorSignText: Text = undefined;
let attackOverlay: AttackOverlay = undefined;
let inputHandler: KeyboardInputHandler = undefined;
let teamOverlay: TeamOverlay = undefined;
let main: HTMLElement = undefined;
let awaitingMove: boolean = false;

ticker.shared.autoStart = false;

document.addEventListener("DOMContentLoaded", () => {
	if ("WebFont" in window) { // fails if not online
		WebFont.load({
			google: {
				families: ["Lato:100,300,400,700"]
			},
			custom: {
				families: ["DK Icons"],
				urls: ["/assets/fonts.css"]
			},
			active: loadAssets
		});
	} else {
		loadAssets();
	}
});

function loadAssets() {
	loader
		.add("dng-proto", "/assets/tiles.json")
		.add("ent-mudkip", "/assets/mudkip.json")
		.add("ent-eevee", "/assets/eevee.json")
		.add("items", "/assets/items.json")
		.add("markers", "/assets/markers.json")
		.once("complete", init);

	loader.load();
}

key.filter = (event: KeyboardEvent) => commandArea ? commandArea.active : false;

function init() {
	socket = new GameSocket();

	socket.onInit((dungeon: CensoredDungeon) => {
		console.info("init");

		state.setState({
			dungeon,
			floor: {
				number: 0,
				map: {
					width: 0,
					height: 0,
					grid: []
				}
			},
			entities: [],
			items: [],
			self: undefined
		});

		startCrawl();
	});

	socket.onInvalid(() => {
		console.info("invalid");
		awaitingMove = true;
	});

	socket.onGraphics((key: string, graphics: GraphicsObjectDescriptor) => {
		console.info("Adding graphics", key);
		GraphicsDescriptorCache.setGraphics(key, graphics);
	});

	socket.onEntityGraphics((key: string, graphics: EntityGraphicsDescriptor) => {
		console.info("Adding entity graphics", key);
		GraphicsDescriptorCache.setEntityGraphics(key, graphics);
	});

	socket.onUpdate(({stateUpdate, log, move}: UpdateMessage) => {
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

	for (let name in PixiUtils.TextureCache) {
		PixiUtils.TextureCache[name].baseTexture.scaleMode = SCALE_MODES.NEAREST;
	}

	PIXI.settings.RESOLUTION = window.devicePixelRatio || 1;

	renderer = autoDetectRenderer(800, 600, {
		antialias: true,
		resolution: PIXI.settings.RESOLUTION
	});

	GraphicsDescriptorCache.setRenderer(renderer);

	gameContainer = new Container();
	main = document.getElementsByTagName("main")[0] as HTMLElement;
	main.appendChild(renderer.view);

	commandArea = new CommandArea();

	commandArea.addHandler("start", {
		label: "start",
		handler: () => {
			socket.emitTempSignal("start");
		}
	});

	commandArea.addHandler("help", {
		label: "help",
		handler: () => {
			messageLog.push(Messages.CONTROLS, 15000);
		}
	});

	commandArea.onInvalid = (msg: string) => { messageLog.push(msg, 10000); }

	if (!isMobile()) {
		inputHandler = new KeyboardInputHandler();
		gameContainer.addChild(commandArea);
	} else {
		// idk lol
	}

	messageLog = new MessageLog();
	gameContainer.addChild(messageLog);

	messageLog.push(Messages.WELCOME, 10000);
	messageLog.push(Messages.START_HELP, 10000);

	window.addEventListener("orientationchange", handleWindowResize);
	window.addEventListener("resize", handleWindowResize);

	handleWindowResize();

	requestAnimationFrame(animate);
}

function startCrawl() {
	setGamePhase(GamePhase.CRAWL);

	dungeonRenderer = new DungeonRenderer(renderer, state.getState().dungeon.graphics);
	gameContainer.addChildAt(dungeonRenderer, 0);

	// minimap = new Minimap(300, 200);
	// minimap.x = 50;
	// minimap.y = 50;
	// gameContainer.addChild(minimap);

	attackOverlay = new AttackOverlay();
	gameContainer.addChild(attackOverlay);

	let roomQuery = /room=([^&]*)(&|$)/.exec(window.location.search);
	let room: string = undefined;

	if (roomQuery) {
		room = roomQuery[1];
	}

	let nameQuery = /name=([^&]*)(&|$)/.exec(window.location.search);
	let name: string = undefined;

	if (nameQuery) {
		name = decodeURI(nameQuery[1]);
	}

	if (room) {
		socket.emitTempSignal("join", room);
	}

	if (name) {
		socket.emitTempSignal("name", name);
	}

	teamOverlay = new TeamOverlay();
	gameContainer.addChild(teamOverlay);

	floorSign = new Container();
	floorSign.alpha = 0;
	gameContainer.addChild(floorSign);

	let g = new Graphics();
	g.beginFill(0x000000);
	g.drawRect(0, 0, window.innerWidth, window.innerHeight);
	g.endFill();
	floorSign.addChild(g);

	floorSignText = new Text("", {
		fontFamily: "Lato",
		fontSize: "32px",
		fontWeight: "300",
		fill: Colors.WHITE,
		align: "center"
	});
	floorSignText.anchor.x = .5;
	floorSignText.anchor.y = .5;
	floorSignText.x = window.innerWidth / 2;
	floorSignText.y = window.innerHeight / 2;
	floorSignText.resolution = window.devicePixelRatio;
	floorSign.addChild(floorSignText);

	handleWindowResize();
}

function handleWindowResize(): void {
	let windowWidth = window.innerWidth;
	let windowHeight = window.innerHeight;

	let rendererWidth = windowWidth;
	let rendererHeight = windowHeight;

	if (isMobile()) {
		rendererHeight = 640;
		rendererWidth = windowWidth / windowHeight * rendererHeight;
	}

	renderer.view.style.width = `${windowWidth}px`;
	renderer.view.style.height = `${windowHeight}px`;

	renderer.resize(rendererWidth, rendererHeight);

	messageLog.x = rendererWidth;
	messageLog.y = rendererHeight;

	commandArea.x = rendererWidth - 310;
	commandArea.y = 10;

	if (floorSignText !== undefined) {
		floorSignText.x = rendererWidth / 2;
		floorSignText.y = rendererHeight / 2;
	}

	if (dungeonRenderer !== undefined) {
		dungeonRenderer.x = rendererWidth / 2;
		dungeonRenderer.y = rendererHeight / 2;
	}

	if (teamOverlay !== undefined) {
		teamOverlay.x = 0;
		teamOverlay.y = rendererHeight;
	}

	// (renderer.view.requestFullscreen || renderer.view.webkitRequestFullscreen || (() => undefined))();
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

		let event = processes.shift();

		let done = () =>
			resolve(getResolutionPromise(processes));

		switch (event.type) {
			case "done":
				console.log("done");
				event.state.floor.mapUpdates.forEach((update) => {
					state.getState().floor.map.grid[update.location.r][update.location.c] = update.tile;
					dungeonRenderer.updateGround(update.location, state.getState().floor.map);
				});

				state.getState().entities = event.state.entities;
				state.getState().items = event.state.items;
				state.getState().self = event.state.self;

				dungeonRenderer.update(state.getState());
				dungeonRenderer.updatePosition(state.getState().floor.map, state.getState().self.location);
				attackOverlay.update();
				teamOverlay.update();

				commandArea.clearHandlers();

				if (state.getState().floor.map.grid
				[state.getState().self.location.r]
				[state.getState().self.location.c]
					.stairs) {
					commandArea.addHandler("stairs", {
						label: "stairs",
						handler: () => {
							socket.sendAction({
								type: "stairs"
							});
						}
					});
				}

				commandArea.addHandler("wait", {
					label: "wait",
					handler: () => {
						socket.sendAction({
							type: "wait"
						});
					}
				});

				if (state.getState().self.items.bag.items !== undefined) {
					for (let item of state.getState().self.items.bag.items) {
						for (let action in item.actions) {
							for (let alias of item.actions[action]) {
								commandArea.addHandler(`${alias} ${item.name}`, {
									label: `${alias} <item>${item.name}</item>`,
									handler: () => {
										socket.sendAction({
											type: "item",
											direction: 0,
											action: action as ItemActionType,
											item: item.id
										});
									}
								});
							}
						}

						if (state.getState().self.items.held.items.length < state.getState().self.items.held.capacity) {
							commandArea.addHandler(`equip ${item.name}`, {
								label: `equip <item>${item.name}</item>`,
								handler: () => {
									socket.sendAction({
										type: "item",
										direction: 0,
										action: "equip",
										item: item.id
									});
								}
							});
						}
					}
				}

				for (let item of state.getState().self.items.held.items) {
					for (let action in item.actions) {
						for (let alias of item.actions[action]) {
							commandArea.addHandler(`${alias} ${item.name}`, {
								label: `${alias} <item>${item.name}</item>`,
								handler: () => {
									socket.sendAction({
										type: "item",
										direction: 0,
										action: action as ItemActionType,
										item: item.id
									});
								}
							});
						}
					}

					if (state.getState().self.items.bag !== undefined
						&& state.getState().self.items.bag.items.length < state.getState().self.items.bag.capacity) {
						commandArea.addHandler(`unequip ${item.name}`, {
							label: `unequip <item>${item.name}</item>`,
							handler: () => {
								socket.sendAction({
									type: "item",
									direction: 0,
									action: "unequip",
									item: item.id
								});
							}
						});
					}
				}

				awaitingMove = awaitingMove || event.move;

				return done();

			case "start":
				state.getState().floor.number = event.floorInformation.number;
				state.getState().floor.map.width = event.floorInformation.width;
				state.getState().floor.map.height = event.floorInformation.height;

				let floorName =
					(state.getState().dungeon.direction === "down" ? "B" : "")
					+ "F"
					+ state.getState().floor.number;

				floorSignText.text = `${state.getState().dungeon.name}\n${floorName}`;

				state.getState().floor.map.grid =
					utils.tabulate((row) =>
						utils.tabulate((col) => ({ type: DungeonTileType.UNKNOWN }), (event as StartLogEvent).floorInformation.width),
					event.floorInformation.height);

				state.getState().self = event.self;

				dungeonRenderer.showFloorStart(state.getState().self.location);

				Tweener.tween(floorSign, { alpha: 1 }, .1)
					.then(() => new Promise((resolve, _) => setTimeout(resolve, 2000)))
					.then(() => {
						setTimeout(() => Tweener.tween(floorSign, { alpha: 0 }, .1), 400);
						setTimeout(done, 400);
					});

				break;

			case "wait":
				setTimeout(done, 200);
				break;

			case "move":
				let getMovePromise = (evt: MoveLogEvent) => {
					if (evt.entity.id === state.getState().self.id) {
						dungeonRenderer.updatePosition(state.getState().floor.map, evt.end);
					}
					return dungeonRenderer.showWalk(evt.entity, evt.start, evt.end, evt.direction);
				};

				let movePromises: Thenable[] = [];
				let deferred: Processable[] = [];

				processes.unshift(event);

				while (processes.length > 0) {
					if (processes[0].type === "move") {
						movePromises.push(getMovePromise(processes.shift() as MoveLogEvent));
					} else if (processes[0].type === "done" || processes[0].type === "item_pickup") {
						deferred.push(processes.shift());
					} else {
						break;
					}
				}

				processes = deferred.concat(processes);

				Promise.all(movePromises).then(done);
				break;

			case "attack":
				messageLog.push(`${highlightEntity(event.entity)} used <attack>${event.attack.name}</attack>.`);
				dungeonRenderer.showAttack(event.entity, event.location, event.direction, event.attack.animation)
					.then(done);
				break;

			case "stat":
				switch (event.stat) {
					case "hp":
						if (event.change < 0) {
							messageLog.push(`${highlightEntity(event.entity)} took <attack>${-event.change}</attack> damage!`);
							dungeonRenderer.showHurt(event.entity, event.location, event.change).then(done);
						} else {
							messageLog.push(`${highlightEntity(event.entity)} recovered <attack>${event.change}</attack> HP!`);
							dungeonRenderer.showHeal(event.entity, event.location, event.change).then(done);
						}
						break;

					case "belly":
						if (event.change <= 0) {
							// idk lol
							done();
						} else {
							messageLog.push(`${highlightEntity(event.entity)}'s belly filled ${event.change <= 60 ? "somewhat" : "greatly"}!`);

							dungeonRenderer.showBelly(event.entity, event.location, Math.ceil(event.change / 6))
								.then(done);
						}
						break;

					default:
						if (event.change < 0) {
							if (event.change < -1) {
								messageLog.push(`${highlightEntity(event.entity)}'s ${event.stat} fell sharply!`);
							} else {
								messageLog.push(`${highlightEntity(event.entity)}'s ${event.stat} fell!`);
							}
						} else {
							if (event.change > 1) {
								messageLog.push(`${highlightEntity(event.entity)}'s ${event.stat} rose sharply!`);
							} else {
								messageLog.push(`${highlightEntity(event.entity)}'s ${event.stat} rose!`);
							}
						}

						done();
						break;
				}
				break;

			case "miss":
				messageLog.push(`The attack missed ${highlightEntity(event.entity)}!`);
				done();
				break;

			case "defeat":
				messageLog.push(`${highlightEntity(event.entity)} was defeated!`);
				dungeonRenderer.showDefeat(event.entity);
				done();
				break;

			case "stairs":
				messageLog.push(`${highlightEntity(event.entity)} went up the stairs!`);
				new Promise((resolve, _) => setTimeout(resolve, 600))
					.then(() => Tweener.tween(floorSign, { alpha: 1 }, .1))
					.then(() => {
						// minimap.clear();
						dungeonRenderer.clear();
						messageLog.clear();
						setTimeout(done, 1000);
					});
				break;

			case "message":
				messageLog.push(event.message);
				done();
				break;

			case "item_pickup":
				messageLog.push(`${highlightEntity(event.entity)} picked up the <item>${event.item.name}</item>.`);
				done();
				break;

			case "item_drop":
				messageLog.push(`${highlightEntity(event.entity)} dropped the <item>${event.item.name}</item>.`);
				done();
				break;
		}
	});
}

function highlightEntity(entity: CondensedEntity): string {
	if (entity.id === state.getState().self.id) {
		return `<self>${entity.name}</self>`;
	} else {
		return `<enemy>${entity.name}</enemy>`;
	}
}

function setGamePhase(state: GamePhase): void {
	switch (state) {
		case GamePhase.CRAWL:
			inputHandler.hooks = [
				{
					keys: [Keys.UP, Keys.DOWN, Keys.LEFT, Keys.RIGHT],
					delay: 4,
					handle: ([up, down, left, right]: boolean[]) => {
						let direction = [-1, 0, 4, -1, 6, 7, 5, -1, 2, 1, 3, -1, -1, -1, -1, -1][(up ? 8 : 0) + (down ? 4 : 0) + (left ? 2 : 0) + (right ? 1 : 0)];
						if (direction < 0) {
							return;
						}
						if (awaitingMove) {
							socket.sendAction({
								type: "move",
								direction
							}, {
								dash: key.isPressed(Keys.B)
							});
							awaitingMove = false;
						}
					},
					enabled: () => awaitingMove
				}
			]
			break;

		case GamePhase.OVERWORLD:
			break;
	}
}

function animate() {
	inputHandler.handleInput();
	Tweener.step();
	renderer.render(gameContainer);
	requestAnimationFrame(animate);
}