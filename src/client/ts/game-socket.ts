"use strict";

export class GameSocket {
	private listeners: Map<string, ((...args: any[]) => void)[]>;
	private socket: SocketIOClient.Socket;

	constructor() {
		this.socket = io();
		this.listeners = new Map();

		this.socket.on("init", (dungeon: Game.Crawl.CensoredDungeon) =>
			this.execute("init", dungeon));
		this.socket.on("invalid", () =>
			this.execute("invalid"));
		this.socket.on("graphics", (key: string, graphics: Game.Graphics.EntityGraphics) =>
			this.execute("graphics", key, graphics));
		this.socket.on("update", (message: Game.Client.UpdateMessage) =>
			this.execute("update", message));
	}

	emitTempSignal(hook: string): void {
		this.socket.emit(hook);
	}

	sendAction(action: Game.Crawl.Action, options?: Game.Client.ActionOptions) {
		this.socket.emit("action", action, options);
	}

	private execute(hook: string, ...args: any[]) {
		this.listeners.get(hook).forEach((fn) => fn(...args));
	}

	// These functions are used instead of the generic on() method to allow for better typechecking.

	onInit(fn: (dungeon: Game.Crawl.CensoredDungeon) => void): void {
		this.addListener("init", fn);
	}

	onInvalid(fn: () => void): void {
		this.addListener("invalid", fn);
	}

	onGraphics(fn: (key: string, graphics: Game.Graphics.EntityGraphics) => void): void {
		this.addListener("graphics", fn);
	}

	onUpdate(fn: (message: Game.Client.UpdateMessage) => void): void {
		this.addListener("update", fn);
	}

	private addListener(hook: string, fn: (...args: any[]) => void): void {
		if (!this.listeners.has(hook)) {
			this.listeners.set(hook, []);
		}

		this.listeners.get(hook).push(fn);
	}
}