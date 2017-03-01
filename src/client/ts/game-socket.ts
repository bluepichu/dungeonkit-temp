"use strict";

export default class GameSocket {
	private listeners: Map<string, ((...args: any[]) => void)[]>;
	private socket: SocketIOClient.Socket;

	constructor() {
		this.socket = io();
	}

	/**
	 * Make the socket send a temporary signal.
	 * TODO (bluepichu): remove this when everything else is done.
	 * @param hook - The socket.io event hook to send this to.
	 * @param args - Arguments to pass to the event hook.
	 */
	emitTempSignal(hook: string, ...args: any[]): void {
		this.socket.emit(hook, ...args);
	}

	/**
	 * Sends a crawl action.
	 * @param action - The action to send.
	 * @param options - Action options to send.
	 */
	sendCrawlAction(action: Action, options?: ActionOptions): void {
		this.socket.emit("crawl-action", action, options);
	}

	/**
	 * Interacts with an overworld entity.
	 * @param entity - The id of the entity to interact with.
	 */
	sendInteraction(id: string): void {
		this.socket.emit("overworld-interact", id);
	}

	/**
	 * Sends a response to an already-initiated interaction.
	 * @param respose - The response.
	 */
	sendInteractionResponse(response: ClientInteractionResponse): void {
		this.socket.emit("overworld-respond", response);
	}

	// These functions are used instead of the generic on() method to allow for better typechecking.

	onCrawlInit(fn: (dungeon: CensoredDungeon) => void): void {
		this.socket.on("crawl-init", fn);
	}

	onCrawlInvalid(fn: () => void): void {
		this.socket.on("crawl-invalid", fn);
	}

	onGraphics(fn: (key: string, graphics: GraphicsObjectDescriptor) => void): void {
		this.socket.on("graphics", fn);
	}

	onEntityGraphics(fn: (key: string, graphics: EntityGraphicsDescriptor) => void): void {
		this.socket.on("entity-graphics", fn);
	}

	onUpdate(fn: (message: UpdateMessage) => void): void {
		this.socket.on("crawl-update", fn);
	}

	onOverworldInit(fn: (scene: ClientOverworldScene) => void): void {
		this.socket.on("overworld-init", fn);
	}

	onInteractContinue(fn: (interaction: Interaction) => void): void {
		this.socket.on("overworld-interact-continue", fn);
	}

	onInteractEnd(fn: () => void): void {
		this.socket.on("overworld-interact-end", fn);
	}

	clearInteractHandlers(): void {
		this.socket.off("overworld-interact-continue");
		this.socket.off("overworld-interact-end");
	}
}