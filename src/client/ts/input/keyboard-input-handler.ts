"use strict";

import CommandArea from "../command-area";
import Keys        from "./keys";

interface Handler {
	keys: number[]
	delay?: number;
	handle: (pressed: boolean[]) => any;
	enabled?: () => boolean;
	always?: boolean;
}

interface ExpandedHandler {
	keys: number[]
	currentKeys: boolean[];
	baseDelay: number;
	currentDelay: number;
	handle: (pressed: boolean[]) => any;
	enabled?: () => boolean;
	always?: boolean;
}

const DIRECTION_INPUT_DELAY = 4;

export default class KeyboardInputHandler {
	private _commandArea: CommandArea;
	private _hooks: ExpandedHandler[];

	constructor() {
		this._commandArea = new CommandArea();
		this._hooks = [];

		document.addEventListener("keydown", (event) => this.commandArea.keypress(event));
	}

	public get commandArea() {
		return this._commandArea;
	}

	public set hooks(hooks: Handler[]) {
		this._hooks = hooks.map((handler: Handler) =>
			({ keys: handler.keys, currentKeys: handler.keys.map(() => false), baseDelay: handler.delay ? handler.delay : 0, currentDelay: 0, handle: handler.handle, enabled: handler.enabled, always: handler.always }));
	}

	public handleInput(): void {
		for (let hook of this._hooks) {
			if (hook.enabled !== undefined && !hook.enabled()) {
				continue;
			}

			let hitKeys = hook.keys.map(key.isPressed);

			if (hook.currentDelay > 0) {
				hook.currentDelay--;
				hook.currentKeys = hook.currentKeys.map((val, i) => val || hitKeys[i]);
			} else if (hitKeys.some((hit) => hit) || hook.always) {
				hook.currentDelay = hook.baseDelay || 0;
				hook.currentKeys = hitKeys;
			} else {
				continue;
			}

			if (hook.currentDelay === 0) {
				hook.handle(hook.currentKeys);
			}
		}
	}
}