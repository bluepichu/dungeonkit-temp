"use strict";

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
let playerId: string = undefined;

document.addEventListener("DOMContentLoaded", () => {
	PIXI.loader
		.add("test", "/images/test.jpg")
		.once("complete", init);

	PIXI.loader.load();
});

key.filter = (event: KeyboardEvent) => commandArea ? commandArea.active : false;

function init() {
	socket = io();

	socket.on("init", (id: string) => {
		console.log("init");
		playerId = id;
	});

	socket.on("go", () => {
		console.log("go");
		awaitingMove = true;
	});

	socket.on("invalid", () => {
		console.log("invalid");
		awaitingMove = true;
	});

	socket.on("events", (evts: Game.Crawl.LogEvent[]) => {
		console.log(evts);
	});

	socket.on("update", (state: Game.Crawl.CensoredEntityCrawlState) => {
		console.log(state);
		minimap.update(state);
		dungeonLayer.update(state);
	});

	let resolution = window.devicePixelRatio || 1;

	renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
		resolution: resolution,
		antialias: true
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

	requestAnimationFrame(animate);
}

function handleCommand(command: string): void {
	// TODO
}

function animate() {
	renderer.render(gameContainer);
	requestAnimationFrame(animate);

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

			if (dir >= 0) {
				let action: Game.Crawl.MoveAction = { type: "move", direction: dir };
				socket.emit("action", action);
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

		this.mapContent.beginFill(0xffffff, 0.1);
		this.mapContent.drawRect(- state.floor.map.width * this.gridSize,
		                         - state.floor.map.height * this.gridSize,
								 3 * state.floor.map.width * this.gridSize,
								 3 * state.floor.map.height * this.gridSize);

		for (let i = 0; i < state.floor.map.height; i++) {
			for (let j = 0; j < state.floor.map.width; j++) {
				if (state.floor.map.grid[i][j].type === "open") {
					this.mapContent.beginFill(state.floor.map.grid[i][j].roomId === 0 ? 0x555555 : 0x999999, 0.5);

					this.mapContent.drawRect(this.gridSize * j,
					                         this.gridSize * i,
											 this.gridSize,
											 this.gridSize);

					this.mapContent.endFill();

					this.mapContent.beginFill(0x222222, 0.5);

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

		this.mapContent.beginFill(0xffff00);

		state.entities.forEach((entity: Game.Crawl.CensoredCrawlEntity) => {
			this.mapContent.drawCircle((entity.location.c + .5) * this.gridSize,
			                           (entity.location.r + .5) * this.gridSize,
									   this.gridSize / 2 - 1);

			if (entity.id === playerId) {
				this.mapContent.x = this.maskWidth / 2 - (entity.location.c + .5) * this.gridSize;
				this.mapContent.y = this.maskHeight / 2 - (entity.location.r + .5) * this.gridSize;
			}
		});
	}

	clear() {
		// TODO
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

	renderCanvas(renderer: PIXI.CanvasRenderer): void {
		this.inputPromptFlashFrameCount++;
		this.inputPromptFlashFrameCount %= 60;

		this.textInput.text = this.buffer + (this.active && this.inputPromptFlashFrameCount < 30 ? "|" : "");
		super.renderCanvas(renderer);
	}

	renderWebGL(renderer: PIXI.WebGLRenderer): void {
		this.inputPromptFlashFrameCount++;
		this.inputPromptFlashFrameCount %= 60;

		this.textInput.text = this.buffer + (this.active && this.inputPromptFlashFrameCount < 30 ? "|" : "");
		super.renderWebGL(renderer);
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
			if (entity.id === playerId) {
				let [ex, ey] = locationToCoordinates(entity.location, 24);

				this.ground.x = -ex;
				this.ground.y = -ey;

				this.entities.x = -ex;
				this.entities.y = -ey;
			}
		});
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
				if (state.floor.map.grid[i][j].type !== "unknown") {
					let tile = this.getFloorTile(state.floor.map.grid[i][j].type);
					[tile.x, tile.y] = locationToCoordinates({ r: i, c: j }, 24);
					this.addChild(tile);
				}
			}
		}
	}

	getFloorTile(type: string): PIXI.DisplayObject {
		let tile = new PIXI.Graphics();

		tile.beginFill(type === "open" ? 0xcccccc : 0x777777);
		tile.drawRect(0, 0, 24, 24);
		tile.endFill();

		return tile;
	}
}

class EntityLayer extends PIXI.Container {
	constructor() {
		super();
	}

	update(state: Game.Crawl.CensoredEntityCrawlState) {
		this.removeChildren();

		state.entities.forEach((entity) => {
			let entitySprite = this.getEntitySprite(entity);
		});
	}

	getEntitySprite(entity: Game.Crawl.CensoredCrawlEntity) {

	}
}

function locationToCoordinates(location: Game.Crawl.Location, gridSize: number): [number, number] {
	return [location.c * gridSize, location.r * gridSize];
}