"use strict";

import * as redis from "redis";

const redisClient = redis.createClient();

export function checkLogin(user: string, pass: string): Promise<User> {
	return new Promise((resolve, reject) => {
		if (typeof user !== "string" || typeof pass !== "string" || !/^[A-Za-z0-9_]+$/.test(user)) {
			// Not in my house
			reject();
			return;
		}


		redisClient.get(`user:${user}`, (err: Error, pw: string) => {
			if (!err && pass === pw) {
				resolve(user);
			} else {
				reject();
			}
		});
	});
}