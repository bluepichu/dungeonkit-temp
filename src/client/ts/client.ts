"use strict";

import {AttackOverlay} from "./attack-overlay";
import * as Colors     from "./colors";
import {CommandArea}   from "./command-area";
import {GameSocket}    from "./game-socket";
import {MessageLog}    from "./message-log";
import {MiniMap}       from "./minimap";
import {TweenHandler}  from "./tween-handler";
import * as utils      from "./utils";

const SCALE = 2;
const GRID_SIZE = 24 * SCALE;

const WALK_SPEED = 4;

let renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer = undefined;
let gameContainer: PIXI.Container = undefined;
let socket: GameSocket = undefined;
let awaitingMove = false;
let inputTimer = 0;
let moveInput = 0;
let minimap: MiniMap = undefined;
let commandArea: CommandArea = undefined;
let dungeonLayer: DungeonLayer = undefined;
let messageLog: MessageLog = undefined;
let tweenHandler: TweenHandler = undefined;
let processChain: Thenable = Promise.resolve();
let floorSign: PIXI.Container = undefined;
let state: Game.Client.CensoredClientCrawlState = undefined;
let entityGraphicsCache: Game.Graphics.EntityGrpahicsCache = new Map();
let attackOverlay: AttackOverlay = undefined;

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
		awaitingMove = true;
	});

	socket.onGraphics((key: string, graphics: Game.Graphics.EntityGraphics) => {
		entityGraphicsCache.set(key, graphics);
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

	dungeonLayer = new DungeonLayer();
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

			awaitingMove = p.move;

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
					dungeonLayer.moveEntity(event.entity, moveEvent.start, moveEvent.end, "walk", moveEvent.direction)
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

function handleCommand(command: string): void {
	// TODO
}

function animate() {
	if (key.isPressed(77)) {
		minimap.resize(600, 600);
	} else {
		minimap.resize(300, 200);
	}

	if (awaitingMove) {
		if (key.shift) {
			if (key.isPressed(49)) {
				awaitingMove = false;

				socket.sendAction({
					type: "attack",
					direction: dungeonLayer.getEntityDirection(state.self.id),
					attack: state.self.attacks[0]
				});
			}

			return;
		}

		if (key.isPressed(37) || key.isPressed(38) || key.isPressed(39) || key.isPressed(40)) {
			awaitingMove = false;
			moveInput = 0;
			inputTimer = 4;
		}
	}

	if (inputTimer > 0) {
		if (key.isPressed(82)) {
			moveInput |= 0b10000;
		}

		if (key.isPressed(37)) {
			moveInput |= 0b01000;
		}

		if (key.isPressed(38)) {
			moveInput |= 0b00100;
		}

		if (key.isPressed(39)) {
			moveInput |= 0b00010;
		}

		if (key.isPressed(40)) {
			moveInput |= 0b00001;
		}

		inputTimer--;

		if (inputTimer === 0) {
			let rot = (moveInput & 0b10000) > 0;
			let dir = inputToDirection(moveInput & 0b1111);

			if (dir !== undefined) {
				dungeonLayer.entityLayer.setEntityAnimation(state.self.id, "idle", dir as number);
				if (rot) {
					awaitingMove = true;
				} else {
					socket.sendAction({
						type: "move",
						direction: dir as number
					}, {
						dash: key.isPressed(66)
					});
				}
			} else {
				awaitingMove = true;
			}
		}
	}

	tweenHandler.step();
	renderer.render(gameContainer);
	requestAnimationFrame(animate);
}

function inputToDirection(input: number): number | void {
	switch (input) {
		case 0b0010:
			return 0;

		case 0b0110:
			return 1;

		case 0b0100:
			return 2;

		case 0b1100:
			return 3;

		case 0b1000:
			return 4;

		case 0b1001:
			return 5;

		case 0b0001:
			return 6;

		case 0b0011:
			return 7;

		default:
			return undefined;
	}
}

function decodeDirection(direction: number): [number, number] {
	switch (direction % 8) {
		case 0:
			return [0, 1];
		case 1:
			return [-1, 1];
		case 2:
			return [-1, 0];
		case 3:
			return [-1, -1];
		case 4:
			return [0, -1];
		case 5:
			return [1, -1];
		case 6:
			return [1, 0];
		case 7:
			return [1, 1];
		default:
			throw new Error(sprintf("[Code 4] %d is not a valid direction.", direction));
	}
}

class DungeonLayer extends PIXI.Container {
	groundLayer: GroundLayer;
	entityLayer: EntityLayer;

	constructor() {
		super();

		this.groundLayer = new GroundLayer();
		this.entityLayer = new EntityLayer();

		this.addChild(this.groundLayer);
		this.addChild(this.entityLayer);
	}

	init(state: Game.Client.CensoredClientCrawlState): void {
		let [offsetX, offsetY] = utils.locationToCoordinates(state.self.location, GRID_SIZE);

		[this.groundLayer.x, this.groundLayer.y] = [-offsetX, -offsetY];
		[this.entityLayer.x, this.entityLayer.y] = [-offsetX, -offsetY];
	}

	moveEntity(entity: Game.Crawl.CondensedEntity,
	           from: Game.Crawl.Location,
	           to: Game.Crawl.Location,
	           animation?: string,
	           direction?: number): Thenable {
		let prm = this.entityLayer.moveEntity(entity, from, to);
		this.entityLayer.setEntityAnimation(entity.id, animation, direction);

		if (entity.id === state.self.id) {
			return Promise.all([prm, this.groundLayer.moveTo(to), this.entityLayer.moveTo(to)]);
		}

		return prm;
	}

	showAnimationOnce(entityId: string, animation: string, direction?: number): Thenable {
		this.entityLayer.setEntityAnimation(entityId, animation, direction);
		return new Promise((resolve, _) => this.entityLayer.setAnimationEndListener(entityId, resolve));
	}

	getEntityDirection(entityId: string): number {
		return this.entityLayer.spriteMap.get(entityId).direction;
	}

	clear(): void {
		this.groundLayer.clear();
		this.entityLayer.clear();
	}
}

class GroundLayer extends PIXI.Container {
	constructor() {
		super();
	}

	update(state: Game.Client.CensoredClientCrawlState, location: Game.Crawl.Location) {
		for (let i = location.r - 1; i <= location.r + 1; i++) {
			for (let j = location.c - 1; j <= location.c + 1; j++) {
				if (i < 0 || i >= state.floor.map.height || j < 0 || j >= state.floor.map.width) {
					continue;
				}

				let tile = this.getFloorTile(state.floor.map, { r: i, c: j }, state.dungeon.graphics);

				if (tile === undefined) {
					continue;
				}

				let dtile = tile as PIXI.DisplayObject;

				[dtile.x, dtile.y] = utils.locationToCoordinates({ r: i, c: j }, GRID_SIZE);
				dtile.scale.x = SCALE;
				dtile.scale.y = SCALE;
				this.addChild(dtile);
			}
		}
	}

	moveTo(loc: Game.Crawl.Location): Thenable {
		let [x, y] = utils.locationToCoordinates(loc, GRID_SIZE);

		let xPrm = tweenHandler.tween(this, "x", -x, WALK_SPEED);
		let yPrm = tweenHandler.tween(this, "y", -y, WALK_SPEED);

		return Promise.all([xPrm, yPrm]);
	}

	private getFloorTile(map: Game.Crawl.Map,
	             loc: Game.Crawl.Location,
	             graphics: Game.Graphics.DungeonGraphics): PIXI.DisplayObject | void {
		if (utils.getTile(map, loc).type === Game.Crawl.DungeonTileType.UNKNOWN) {
			return undefined;
		}

		let pattern = 0;

		for (let i = 0; i < 8; i++) {
			let [dr, dc] = decodeDirection(i);

			pattern <<= 1;
			let [r, c] = [loc.r + dr, loc.c + dc];

			if (0 <= r && r < map.height && 0 <= c && c < map.width) {
				switch (utils.getTile(map, {r, c}).type) {
					case Game.Crawl.DungeonTileType.UNKNOWN:
						return undefined;

					case Game.Crawl.DungeonTileType.WALL:
						pattern |= 1;
				}
			} else {
				pattern |= 1;
			}
		}

		if (map.grid[loc.r][loc.c].stairs) {
			return generateGraphicsObject(graphics.base, graphics.stairs);
		}

		if (utils.getTile(map, loc).type === Game.Crawl.DungeonTileType.FLOOR) {
			return generateGraphicsObject(graphics.base, graphics.open);
		}

		for (let i = 0; i < graphics.walls.length; i++) {
			if ((graphics.walls[i].pattern & pattern) === graphics.walls[i].pattern) {
				return generateGraphicsObject(graphics.base, graphics.walls[i].object);
			}
		}
	}

	clear(): void {
		this.removeChildren();
	}
}

function generateGraphicsObject(base: string, obj: Game.Graphics.GraphicsObject): PIXI.DisplayObject {
	switch (obj.type) {
		case "static":
			let sgo: Game.Graphics.StaticGraphicsObject = obj as Game.Graphics.StaticGraphicsObject;
			let ret = new PIXI.Container();

			sgo.frames.reverse().forEach((frame) => {
				let sprite = PIXI.Sprite.fromFrame(sprintf("%s-%s", base, frame.texture));
				sprite.x = -frame.anchor.x;
				sprite.y = -frame.anchor.y;

				ret.addChild(sprite);
			});

			sgo.frames.reverse();

			return ret;

		case "animated":
			return new AnimatedSprite(base, obj as Game.Graphics.AnimatedGraphicsObject);
	}
}

class AnimatedSprite extends PIXI.Container {
	descriptor: Game.Graphics.AnimatedGraphicsObject;
	animation: string;
	step: number;
	frame: number;
	base: string;
	changed: boolean;
	sprites: PIXI.Sprite[];
	animationEndListeners: (() => any)[];

	constructor(base: string, descriptor: Game.Graphics.AnimatedGraphicsObject) {
		super();
		this.descriptor = descriptor;
		this.animation = descriptor.default;
		this.step = 0;
		this.frame = 0;
		this.base = base;
		this.scale.x = SCALE;
		this.scale.y = SCALE;
		this.changed = true;
		this.animationEndListeners = [];

		let spriteCount = 0;

		for (let animation in this.descriptor.animations) {
			this.descriptor.animations[animation].steps.forEach((step) => {
				spriteCount = Math.max(spriteCount, step.frames.length);
			});
		}

		this.sprites = [];

		for (let i = 0; i < spriteCount; i++) {
			this.sprites.push(new PIXI.Sprite());
		}

		for (let i = spriteCount - 1; i >= 0; i--) {
			this.addChild(this.sprites[i]);
		}
	}

	addAnimationEndListener(f: () => any) {
		this.animationEndListeners.push(f);
	}

	setAnimation(animation: string): void {
		if (this.animation !== animation) {
			this.animation = animation;
			this.step = 0;
			this.frame = 0;
			this.changed = true;
		}
	}

	protected handleOffset(sprite: PIXI.Sprite, amount: number): void {}

	protected getTexture(frame: Game.Graphics.Frame): PIXI.Texture {
		return PIXI.Texture.fromFrame(sprintf("%s-%s", this.base, frame.texture));
	}

	prerender() {
		this.frame++;

		if (this.frame >= this.descriptor.animations[this.animation].steps[this.step].duration) {
			this.frame = 0;
			this.step++;
			this.step %= this.descriptor.animations[this.animation].steps.length;
			this.changed = true;
		}

		if (this.frame === 0 && this.step === 0) {
			this.animationEndListeners.forEach((f) => f());
			this.animationEndListeners = [];
		}

		if (!this.changed) {
			return;
		}

		let frames = this.descriptor.animations[this.animation].steps[this.step].frames;

		for (let i = 0; i < this.sprites.length; i++) {
			if (i >= frames.length) {
				this.sprites[i].visible = false;
			} else {
				this.sprites[i].visible = true;
				this.sprites[i].texture = this.getTexture(frames[i]);

				this.sprites[i].width = this.sprites[i].texture.width;
				this.sprites[i].height = this.sprites[i].texture.height;

				this.sprites[i].x = -frames[i].anchor.x;
				this.sprites[i].y = -frames[i].anchor.y;

				if (frames[i].offset !== undefined) {
					this.handleOffset(this.sprites[i], frames[i].offset);
				}
			}
		}

		this.changed = false;
	}

	renderCanvas(renderer: PIXI.CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	renderWebGL(renderer: PIXI.WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}
}

class EntitySprite extends AnimatedSprite {
	private _direction: number;

	constructor(base: string, descriptor: Game.Graphics.AnimatedGraphicsObject) {
		super(base, descriptor);
		this.direction = 6;
	}

	protected handleOffset(sprite: PIXI.Sprite, amount: number): void {
		let [dy, dx] = decodeDirection(this.direction);

		dx *= amount * GRID_SIZE;
		dy *= amount * GRID_SIZE;

		sprite.x += dx;
		sprite.y += dy;
	}

	get direction(): number {
		return this._direction;
	}

	set direction(direction: number) {
		this._direction = direction;
		this.changed = true;
	}

	protected getTexture(frame: Game.Graphics.Frame): PIXI.Texture {
		let textureName = sprintf(frame.texture, { dir: this.direction });
		return PIXI.Texture.fromFrame(sprintf("%s-%s", this.base, textureName));
	}
}

class EntityLayer extends PIXI.Container {
	spriteMap: Map<string, EntitySprite>;

	constructor() {
		super();
		this.spriteMap = new Map();
	}

	update(state: Game.Client.CensoredClientCrawlState) {
		let keys: Set<string> = new Set(this.spriteMap.keys());

		state.entities.forEach((entity) => {
			keys.delete(entity.id);

			if (this.spriteMap.has(entity.id)) {
				let entitySprite = this.spriteMap.get(entity.id);

				[entitySprite.x, entitySprite.y] = utils.locationToCoordinates(entity.location, GRID_SIZE);
			} else {
				this.addEntity(entity, entity.location);
			}
		});

		keys.forEach((id) => {
			this.removeChild(this.spriteMap.get(id));
			this.spriteMap.delete(id);
		});
	}

	addEntity(entity: Game.Crawl.CondensedEntity, location: Game.Crawl.Location) {
		let entitySprite = this.getEntitySprite(entity.graphics);

		[entitySprite.x, entitySprite.y] = utils.locationToCoordinates(location, GRID_SIZE);

		this.addChild(entitySprite);
		this.spriteMap.set(entity.id, entitySprite);
	}

	getEntitySprite(entityGraphicsKey: string): EntitySprite {
		let entityGraphics = entityGraphicsCache.get(entityGraphicsKey);
		return new EntitySprite(entityGraphics.base, entityGraphics.object);
	}

	moveEntity(entity: Game.Crawl.CondensedEntity, from: Game.Crawl.Location, to: Game.Crawl.Location): Thenable {
		if (!this.spriteMap.has(entity.id)) {
			this.addEntity(entity, from);
		}

		let [xTarget, yTarget] = utils.locationToCoordinates(to, GRID_SIZE);

		let xPrm = tweenHandler.tween(this.spriteMap.get(entity.id), "x", xTarget, WALK_SPEED);
		let yPrm = tweenHandler.tween(this.spriteMap.get(entity.id), "y", yTarget, WALK_SPEED);

		return Promise.all([xPrm, yPrm]);
	}

	moveTo(location: Game.Crawl.Location): Thenable {
		let [xTarget, yTarget] = utils.locationToCoordinates(location, GRID_SIZE);

		let xPrm = tweenHandler.tween(this, "x", -xTarget, WALK_SPEED);
		let yPrm = tweenHandler.tween(this, "y", -yTarget, WALK_SPEED);

		return Promise.all([xPrm, yPrm]);
	}

	setEntityAnimation(entityId: string, animation: string, direction?: number) {
		this.spriteMap.get(entityId).setAnimation(animation);

		if (direction !== undefined) {
			this.spriteMap.get(entityId).direction = direction;
		}
	}

	setAnimationEndListener(entityId: string, f: () => any) {
		this.spriteMap.get(entityId).addAnimationEndListener(f);
	}

	clear(): void {
		this.removeChildren();
		this.spriteMap.clear();
	}

	prerender(): void {
		this.children.sort((a: EntitySprite, b: EntitySprite) => a.y - b.y);
	}

	renderCanvas(renderer: PIXI.CanvasRenderer): void {
		this.prerender();
		super.renderCanvas(renderer);
	}

	renderWebGL(renderer: PIXI.WebGLRenderer): void {
		this.prerender();
		super.renderWebGL(renderer);
	}
}