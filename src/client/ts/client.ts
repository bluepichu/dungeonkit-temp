"use strict";

const SCALE = 2;
const GRID_SIZE = 24 * SCALE;

const WALK_SPEED = 4;

type Processable = Game.Crawl.LogEvent | { type: "done", move: boolean, state: Game.Crawl.CensoredEntityCrawlState };
type Thenable = PromiseLike<any>;

let renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer = undefined;
let gameContainer: PIXI.Container = undefined;
let inputFlashFrameCount = 0;
let socket: SocketIOClient.Socket = undefined;
let awaitingMove = false;
let inputTimer = 0;
let moveInput = 0;
let minimap: MiniMap = undefined;
let commandArea: CommandArea = undefined;
let dungeonLayer: DungeonLayer = undefined;
let messageLog: MessageLog = undefined;
let player: Game.Crawl.CensoredSelfCrawlEntity = undefined;
let tweenHandler: TweenHandler = undefined;
let processChain: Thenable = Promise.resolve();
let prerender: (() => any)[] = [];
let floorSign: PIXI.Container = undefined;

document.addEventListener("DOMContentLoaded", () => {
	PIXI.loader
		.add("dng-proto", "/assets/tiles.json")
		.add("ent-mudkip", "/assets/mudkip.json")
		.once("complete", init);

	PIXI.loader.load();
});

key.filter = (event: KeyboardEvent) => commandArea ? commandArea.active : false;

function addPrerender(f: () => any): void {
	prerender.push(f);
}

function removePrerender(f: () => any): void {
	let ind = prerender.indexOf(f);

	if (ind >= 0) {
		prerender.splice(ind, 1);
	}
}

function init() {
	socket = io();

	socket.on("init", (id: string) => {
		console.log("init");
	});

	socket.on("invalid", () => {
		console.log("invalid");
		awaitingMove = true;
	});

	socket.on("update", ({state, log, move}: Game.Crawl.ClientUpdate) => {
		let updates: Processable[] = log;

		if (state !== undefined) {
			player = state.self;
			updates.push({ type: "done", move: move, state: state });
		}

		processAll(updates);
	});

	let resolution = window.devicePixelRatio || 1;

	renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
		resolution: resolution,
		antialias: false
	});

	gameContainer = new PIXI.Container();
	document.getElementsByTagName("main")[0].appendChild(renderer.view);

	dungeonLayer = new DungeonLayer();
	dungeonLayer.x = window.innerWidth / 2;
	dungeonLayer.y = window.innerHeight / 2;
	gameContainer.addChild(dungeonLayer);

	minimap = new MiniMap(300, 200);
	minimap.x = 50;
	minimap.y = 50;
	gameContainer.addChild(minimap);

	commandArea = new CommandArea(300, 36);
	commandArea.x = window.innerWidth - 350;
	commandArea.y = 50;
	gameContainer.addChild(commandArea);

	messageLog = new MessageLog();
	messageLog.x = window.innerWidth;
	messageLog.y = window.innerHeight;
	gameContainer.addChild(messageLog);

	floorSign = new PIXI.Container();
	floorSign.alpha = 0;

	tweenHandler = new TweenHandler();

	requestAnimationFrame(animate);
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
			let p = proc as { type: "done", move: boolean, state: Game.Crawl.CensoredEntityCrawlState };

			console.log("start update");

			minimap.update(p.state);
			dungeonLayer.update(p.state);

			console.log("end update", Math.random());

			awaitingMove = p.move;

			resolve();
		} else {
			let event = proc as Game.Crawl.LogEvent;

			switch (event.type) {
				case "wait":
					messageLog.push(sprintf("%s waits.", event.entity.name));
					resolve();
					break;

				case "move":
					let mEvent = event as Game.Crawl.MoveLogEvent;
					messageLog.push(sprintf("%s moves.", event.entity.name));
					dungeonLayer.moveEntity(event.entity, mEvent.start, mEvent.end, "walk", mEvent.direction)
						.then(() => dungeonLayer.setEntityAnimation(mEvent.entity.id, "idle"))
						.then(resolve);
					break;

				case "attack":
					messageLog.push(sprintf("%s attacks!", event.entity.name));
					resolve();
					break;

				case "stat":
					messageLog.push(sprintf("%s does stat things!", event.entity.name));
					resolve();
					break;

				case "stairs":
					messageLog.push(sprintf("%s went up the stairs!", event.entity.name));
					tweenHandler.tween(floorSign, "alpha", 1, .1)
						.then(() => new Promise((resolve, reject) => {
							minimap.clear();
							dungeonLayer.clear();
							console.log("wait for it...");

							setTimeout(resolve, 2400);
						}))
						.then(() => {
							console.log("done with the wait.");
							tweenHandler.tween(floorSign, "alpha", 0, .1);
						})
						.then(resolve);
					break;
			}
		}
	});
}

function handleCommand(command: string): void {
	// TODO
}

function animate() {
	// prerender.forEach((f) => f());
	renderer.render(gameContainer);
	requestAnimationFrame(animate);
	tweenHandler.step();

	if (key.isPressed(77)) {
		minimap.resize(600, 600);
	} else {
		minimap.resize(300, 200);
	}

	if (awaitingMove) {
		if (key.isPressed(37) || key.isPressed(38) || key.isPressed(39) || key.isPressed(40)) {
			awaitingMove = false;
			moveInput = 0;
			inputTimer = 4;
		}
	}

	if (inputTimer > 0) {
		if (key.isPressed(37)) {
			moveInput |= 0b1000;
		}

		if (key.isPressed(38)) {
			moveInput |= 0b0100;
		}

		if (key.isPressed(39)) {
			moveInput |= 0b0010;
		}

		if (key.isPressed(40)) {
			moveInput |= 0b0001;
		}

		inputTimer--;

		if (inputTimer === 0) {
			let dir = -1;

			switch (moveInput) {
				case 0b0010:
					dir = 0;
					break;

				case 0b0110:
					dir = 1;
					break;

				case 0b0100:
					dir = 2;
					break;

				case 0b1100:
					dir = 3;
					break;

				case 0b1000:
					dir = 4;
					break;

				case 0b1001:
					dir = 5;
					break;

				case 0b0001:
					dir = 6;
					break;

				case 0b0011:
					dir = 7;
					break;
			}


			let options: Game.Crawl.ClientActionOptions = {
				dash: key.isPressed(66)
			};

			if (dir >= 0) {
				let action: Game.Crawl.MoveAction = { type: "move", direction: dir };
				socket.emit("action", action, options);
			} else {
				awaitingMove = true;
			}
		}
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

class MiniMap extends PIXI.Container {
	mapMask: PIXI.Graphics;
	mapContent: PIXI.Graphics;
	maskWidth: number;
	maskHeight: number;
	gridSize: number;

	constructor(width: number, height: number) {
		super();

		this.maskWidth = width;
		this.maskHeight = height;

		this.mapMask = new PIXI.Graphics();
		this.mapMask.beginFill(0x000000);
		this.mapMask.drawRect(0, 0, width, height);
		this.mapMask.endFill();

		this.mapContent = new PIXI.Graphics();
		this.mapContent.mask = this.mapMask;

		this.addChild(this.mapMask);
		this.addChild(this.mapContent);

		this.gridSize = 8;
	}

	resize(width: number, height: number) {
		if (this.maskWidth !== width || this.height !== height) {
			this.mapMask.clear();
			this.mapMask.beginFill(0x000000);
			this.mapMask.drawRect(0, 0, width, height);
			this.mapMask.endFill();

			this.mapContent.x += (width - this.maskWidth) / 2;
			this.mapContent.y += (height - this.maskHeight) / 2;

			this.maskWidth = width;
			this.maskHeight = height;
		}
	}

	update(state: Game.Crawl.CensoredEntityCrawlState) {
		this.mapContent.clear();

		this.mapContent.beginFill(0x2d2d2d);
		this.mapContent.drawRect(- state.floor.map.width * this.gridSize,
		                         - state.floor.map.height * this.gridSize,
								 3 * state.floor.map.width * this.gridSize,
								 3 * state.floor.map.height * this.gridSize);

		for (let i = 0; i < state.floor.map.height; i++) {
			for (let j = 0; j < state.floor.map.width; j++) {
				if (state.floor.map.grid[i][j].type === "open") {
					this.mapContent.beginFill(state.floor.map.grid[i][j].roomId === 0 ? 0x666666 : 0x888888);

					this.mapContent.drawRect(this.gridSize * j,
					                         this.gridSize * i,
											 this.gridSize,
											 this.gridSize);

					this.mapContent.endFill();

					this.mapContent.beginFill(0x444444);

					if (0 <= i - 1 && state.floor.map.grid[i - 1][j].type === "unknown") {
						this.mapContent.drawRect(this.gridSize * j,
						                         this.gridSize * i,
												 this.gridSize,
												 this.gridSize * .25);
					}

					if (0 <= j - 1 && state.floor.map.grid[i][j - 1].type === "unknown") {
						this.mapContent.drawRect(this.gridSize * j,
						                         this.gridSize * i,
												 this.gridSize * .25,
												 this.gridSize);
					}

					if (i + 1 < state.floor.map.height && state.floor.map.grid[i + 1][j].type === "unknown") {
						this.mapContent.drawRect(this.gridSize * j,
							                     this.gridSize * (i + .75),
												 this.gridSize,
												 this.gridSize * .25);
					}

					if (j + 1 < state.floor.map.width && state.floor.map.grid[i][j + 1].type === "unknown") {
						this.mapContent.drawRect(this.gridSize * (j + .75),
						                         this.gridSize * i,
												 this.gridSize * .25,
												 this.gridSize);
					}

					this.mapContent.endFill();

					if (state.floor.map.grid[i][j].stairs) {
						this.mapContent.lineStyle(1, 0x00aaff);

						this.mapContent.drawRect(this.gridSize * j + 1,
						                         this.gridSize * i + 1,
												 this.gridSize - 2,
						                         this.gridSize - 2);

						this.mapContent.lineStyle(0);
					}
				}
			}
		}

		state.entities.forEach((entity: Game.Crawl.CensoredCrawlEntity) => {
			this.mapContent.beginFill(entity.id === player.id ? 0xffcc66 : 0xea777a);

			this.mapContent.drawCircle((entity.location.c + .5) * this.gridSize,
			                           (entity.location.r + .5) * this.gridSize,
			                           this.gridSize / 2 - 1);

			this.mapContent.endFill();

			if (entity.id === player.id) {
				this.mapContent.x = this.maskWidth / 2 - (entity.location.c + .5) * this.gridSize;
				this.mapContent.y = this.maskHeight / 2 - (entity.location.r + .5) * this.gridSize;
			}
		});
	}

	clear() {
		this.mapContent.clear();
	}
}

const COMMAND_AREA_INACTIVE_STYLE = {
	font: "16px Aller-Light",
	fill: 0x888888
};

const COMMAND_AREA_ACTIVE_STYLE = {
	font: "16px Aller-Light",
	fill: 0xffffff
};

const COMMAND_AREA_DEFAULT_TEXT = "Press space to input a command...";

class CommandArea extends PIXI.Container {
	private _active: boolean;
	private background: PIXI.Graphics;
	private textInput: PIXI.Text;
	private buffer: string;
	private inputPromptFlashFrameCount: number;

	constructor(width: number, height: number) {
		super();

		this.background = new PIXI.Graphics();
		this.background.beginFill(0x666666);
		this.background.drawRect(0, 0, width, height);
		this.background.endFill();

		this.textInput = new PIXI.Text(COMMAND_AREA_DEFAULT_TEXT);
		this.textInput.x = 8;
		this.textInput.y = 8;
		this.textInput.resolution = window.devicePixelRatio;

		this.addChild(this.background);
		this.addChild(this.textInput);

		this.active = false;

		document.addEventListener("keydown", (event) => this.keypress(event));

		addPrerender(this.prerender.bind(this));
	}

	get active(): boolean {
		return this._active;
	}

	set active(active: boolean) {
		this._active = active;

		if (active) {
			this.textInput.style = COMMAND_AREA_ACTIVE_STYLE;
			this.buffer = "";
			this.inputPromptFlashFrameCount = 0;
		} else {
			this.textInput.style = COMMAND_AREA_INACTIVE_STYLE;
			this.buffer = COMMAND_AREA_DEFAULT_TEXT;
		}
	}

	keypress(event: KeyboardEvent): void {
		event.preventDefault();

		if (!this.active) {
			if (event.key === " ") {
				this.active = true;
				event.stopImmediatePropagation();
			}
			return;
		}

		switch (event.key) {
			case "Enter":
				this.enter();
				this.active = false;
				break;

			case "Escape":
				this.active = false;
				break;

			case "Backspace":
				if (this.buffer.length > 0) {
					this.buffer = this.buffer.slice(0, -1);
				}
				break;

			default:
				if (event.key.length === 1) {
					this.buffer += event.key;
				}
				break;
		}

		this.inputPromptFlashFrameCount = 0;
		event.stopImmediatePropagation();
	}

	enter(): void {
		let command = this.buffer;

		if (command === "start") {
			socket.emit("start");
			return;
		}
	}

	prerender(): void {
		this.inputPromptFlashFrameCount++;
		this.inputPromptFlashFrameCount %= 60;

		this.textInput.text = this.buffer + (this.active && this.inputPromptFlashFrameCount < 30 ? "|" : "");
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

class MessageLog extends PIXI.Container {
	messages: PIXI.Container[];
	timeouts: number[];
	keepTime: number;
	spacing: number;
	maximum: number;

	constructor() {
		super();
		this.messages = [];
		this.timeouts = [];

		this.spacing = 40;
		this.keepTime = 5000;
		this.maximum = 12;
	}

	push(message: string): void {
		let msg = this.createMessage(message);
		this.addChild(msg);
		msg.x = msg.width + 12;
		msg.y = -12;

		this.messages.unshift(msg);

		while (this.messages.length > this.maximum) {
			this.pop();
		}

		this.messages.forEach((message, index) => {
			tweenHandler.tween(message, "x", -12, 1.1, "smooth");
			tweenHandler.tween(message, "y", -index * this.spacing - 12, 1.1, "smooth");
		});

		this.timeouts.unshift(setTimeout(this.pop.bind(this), this.keepTime));
	}

	pop(): void {
		if (this.messages.length === 0) {
			return;
		}

		let last: PIXI.Container = this.messages.pop();
		clearTimeout(this.timeouts.pop());

		tweenHandler.tween(last, "x", last.width + 12, 1.1, "smooth").then(() => this.removeChild(last));
	}

	createMessage(message: string): PIXI.Container {
		let ret = new PIXI.Container();

		let text = new PIXI.Text(message, COMMAND_AREA_ACTIVE_STYLE);
		text.style.align = "right";
		text.anchor.x = 1;
		text.anchor.y = 1;
		text.resolution = window.devicePixelRatio;

		let bg = new PIXI.Graphics();

		bg.beginFill(0xffffff, .2);
		bg.drawRect(-text.width - 8, -text.height - 8, text.width + 16, text.height + 16);
		bg.endFill();

		ret.addChild(bg);
		ret.addChild(text);

		return ret;
	}
}

class DungeonLayer extends PIXI.Container {
	private ground: GroundLayer;
	private entities: EntityLayer;

	constructor() {
		super();

		this.ground = new GroundLayer();
		this.entities = new EntityLayer();

		this.addChild(this.ground);
		this.addChild(this.entities);
	}

	update(state: Game.Crawl.CensoredEntityCrawlState) {
		this.ground.update(state);
		this.entities.update(state);

		state.entities.forEach((entity) => {
			if (entity.id === player.id) {
				let [ex, ey] = locationToCoordinates(entity.location, GRID_SIZE);

				this.ground.x = -ex;
				this.ground.y = -ey;

				this.entities.x = -ex;
				this.entities.y = -ey;
			}
		});
	}

	moveEntity(entity: Game.Crawl.CondensedEntity,
	           from: Game.Crawl.Location,
	           to: Game.Crawl.Location,
	           animation?: string,
	           direction?: number): Thenable {
		let prm = this.entities.moveEntity(entity, from, to);
		this.setEntityAnimation(entity.id, animation, direction);

		if (entity.id === player.id) {
			return Promise.all([prm, this.ground.moveTo(to), this.entities.moveTo(to)]);
		}

		return prm;
	}

	setEntityAnimation(entityId: string, animation: string, direction?: number): void {
		this.entities.setEntityAnimation(entityId, animation, direction);
	}

	clear(): void {
		this.ground.clear();
		this.entities.clear();
	}
}

class GroundLayer extends PIXI.Container {
	constructor() {
		super();
	}

	update(state: Game.Crawl.CensoredEntityCrawlState) {
		this.removeChildren();

		for (let i = 0; i < state.floor.map.height; i++) {
			for (let j = 0; j < state.floor.map.width; j++) {
				let tile = this.getFloorTile(state.floor.map, { r: i, c: j }, state.dungeon.graphics);

				if (tile === undefined) {
					continue;
				}

				let dtile = tile as PIXI.DisplayObject;

				[dtile.x, dtile.y] = locationToCoordinates({ r: i, c: j }, GRID_SIZE);
				dtile.scale.x = SCALE;
				dtile.scale.y = SCALE;
				this.addChild(dtile);
			}
		}
	}

	moveTo(loc: Game.Crawl.Location): Thenable {
		let [x, y] = locationToCoordinates(loc, GRID_SIZE);

		let xPrm = tweenHandler.tween(this, "x", -x, WALK_SPEED);
		let yPrm = tweenHandler.tween(this, "y", -y, WALK_SPEED);

		return Promise.all([xPrm, yPrm]);
	}

	private getFloorTile(map: Game.Crawl.Map,
	             loc: Game.Crawl.Location,
	             graphics: Game.Graphics.DungeonGraphics): PIXI.DisplayObject | void {
		if (map.grid[loc.r][loc.c].type === "unknown") {
			return undefined;
		}

		let pattern = 0;

		for (let i = 0; i < 8; i++) {
			let [dr, dc] = decodeDirection(i);

			pattern <<= 1;
			let [r, c] = [loc.r + dr, loc.c + dc];

			if (0 <= r && r < map.height && 0 <= c && c < map.width) {
				if (map.grid[r][c].type === "unknown") {
					return undefined;
				} else if (map.grid[r][c].type === "wall") {
					pattern |= 1;
				}
			} else {
				pattern |= 1;
			}
		}

		if (map.grid[loc.r][loc.c].stairs) {
			return generateGraphicsObject(graphics.base, graphics.stairs);
		}

		if (map.grid[loc.r][loc.c].type === "open") {
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

		addPrerender(this.prerender.bind(this));
	}

	setAnimation(animation: string): void {
		this.animation = animation;
		this.step = 0;
		this.frame = 0;
		this.changed = true;
	}

	prerender() {
		this.frame++;

		if (this.frame >= this.descriptor.animations[this.animation].steps[this.step].duration) {
			this.frame = 0;
			this.step++;
			this.step %= this.descriptor.animations[this.animation].steps.length;
			this.changed = true;
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
			}
		}

		this.changed = false;
	}

	protected getTexture(frame: Game.Graphics.Frame): PIXI.Texture {
		return PIXI.Texture.fromFrame(sprintf("%s-%s", this.base, frame.texture));
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
	direction: number;

	constructor(base: string, descriptor: Game.Graphics.AnimatedGraphicsObject) {
		super(base, descriptor);
		this.direction = 6;
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

	update(state: Game.Crawl.CensoredEntityCrawlState) {
		let keys: Set<string> = new Set(this.spriteMap.keys());

		state.entities.forEach((entity) => {
			keys.delete(entity.id);

			if (this.spriteMap.has(entity.id)) {
				let entitySprite = this.spriteMap.get(entity.id);

				[entitySprite.x, entitySprite.y] = locationToCoordinates(entity.location, GRID_SIZE);
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

		[entitySprite.x, entitySprite.y] = locationToCoordinates(location, GRID_SIZE);

		this.addChild(entitySprite);
		this.spriteMap.set(entity.id, entitySprite);
	}

	getEntitySprite(entityGraphics: Game.Graphics.EntityGraphics): EntitySprite {
		return new EntitySprite(entityGraphics.base, entityGraphics.object);
	}

	moveEntity(entity: Game.Crawl.CondensedEntity, from: Game.Crawl.Location, to: Game.Crawl.Location): Thenable {
		if (!this.spriteMap.has(entity.id)) {
			this.addEntity(entity, from);
		}

		let [xTarget, yTarget] = locationToCoordinates(to, GRID_SIZE);

		let xPrm = tweenHandler.tween(this.spriteMap.get(entity.id), "x", xTarget, WALK_SPEED);
		let yPrm = tweenHandler.tween(this.spriteMap.get(entity.id), "y", yTarget, WALK_SPEED);

		return Promise.all([xPrm, yPrm]);
	}

	moveTo(location: Game.Crawl.Location): Thenable {
		let [xTarget, yTarget] = locationToCoordinates(location, GRID_SIZE);

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

	clear(): void {
		this.removeChildren();
		this.spriteMap.clear();
	}
}

class TweenHandler {
	private tweens: Tween[];

	constructor() {
		this.tweens = [];
	}

	tween(obj: any, key: string, target: number, velocity: number, type?: "linear" | "smooth"): Thenable {
		this.tweens = this.tweens.filter((tween) => tween.object !== obj || tween.key !== key);
		return new Promise((resolve, reject) => {
			this.tweens.push(new Tween(obj, key, target, velocity, type, resolve));
		});
	}

	step() {
		this.tweens = this.tweens.filter((tween) => tween.step());
	}
}

type TweenType = "linear" | "smooth";

class Tween {
	object: any;
	key: string;
	target: number;
	velocity: number;
	type: TweenType;
	onComplete: Function;

	constructor(obj: any, key: string, target: number, velocity: number, type?: TweenType, onComplete?: Function) {
		this.object = obj;
		this.key = key;
		this.target = target;
		this.velocity = velocity;
		this.onComplete = onComplete;
		this.type = type || "linear";
	}

	step(): boolean {
		if (this.type === "linear") {
			if (Math.abs(this.object[this.key] - this.target) < this.velocity) {
				this.object[this.key] = this.target;

				if (this.onComplete) {
					this.onComplete();
				}

				return false;
			} else {
				if (this.object[this.key] > this.target) {
					this.object[this.key] -= this.velocity;
				} else {
					this.object[this.key] += this.velocity;
				}

				return true;
			}
		}

		if (this.type === "smooth") {
			if (Math.abs(this.object[this.key] - this.target) < .1) {
				this.object[this.key] = this.target;

				if (this.onComplete) {
					this.onComplete();
				}

				return false;
			} else {
				this.object[this.key] = (this.object[this.key] + this.target * (this.velocity - 1)) / this.velocity;

				return true;
			}
		}
	}
}

function locationToCoordinates(location: Game.Crawl.Location, gridSize: number): [number, number] {
	return [location.c * gridSize, location.r * gridSize];
}