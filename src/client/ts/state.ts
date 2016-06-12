"use strict";

let _state: Game.Client.CensoredClientCrawlState = undefined;

export function getState(): Game.Client.CensoredClientCrawlState {
	return _state;
}

export function setState(state: Game.Client.CensoredClientCrawlState): void {
	_state = state;
}