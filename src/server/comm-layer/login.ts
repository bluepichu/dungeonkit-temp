"use strict";

import * as crypto from "crypto";
import * as redis  from "redis";

const redisClient = redis.createClient();
const log = require("beautiful-log")("dk:login");

export function checkLogin(user: string, pass: string): Promise<User> {
	return new Promise((resolve, reject) => {
		if (typeof user !== "string" || typeof pass !== "string" || !/^[A-Za-z0-9_]+$/.test(user)) {
			// Not in my house
			log("rip");
			reject();
			return;
		}

		let hash = crypto.createHash("sha256");
		hash.update(pass);

		redisClient.get(`user:${user}`, (err: Error, pw: string) => {
			if (!err && hash.digest("hex") === pw) {
				log("Logged in!");
				resolve(user);
			} else {
				reject();
			}
		});
	});
}