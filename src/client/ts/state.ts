"use strict";

let _state: Client.CensoredClientCrawlState = undefined;

export function getState(): Client.CensoredClientCrawlState {
	return _state;
}

export function setState(state: Client.CensoredClientCrawlState): void {
	_state = state;
}