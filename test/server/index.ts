"use strict";

import { testGame } from "./game";

export function testServer() {
	describe("server", () => {
		testGame();
	});
}