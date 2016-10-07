"use strict";

let _state: CensoredClientCrawlState = undefined;

export function getState(): CensoredClientCrawlState {
	return _state;
}

export function setState(state: CensoredClientCrawlState): void {
	_state = state;
}