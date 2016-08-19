"use strict";

import { testCrawl }     from "./crawl-test";
import { testGenerator } from "./generator-test";

export function testGame() {
	describe("game", () => {
		testCrawl();
		testGenerator();
	});
}