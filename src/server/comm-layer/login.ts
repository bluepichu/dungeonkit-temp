"use strict";

const mongo = require("promised-mongo");
const db = mongo("mongodb://localhost:27017/dungeonkit", ["users"]);

export function checkLogin(user: string, pass: string): Promise<User> {
	return new Promise((resolve, reject) => {
		if (typeof user !== "string" || typeof pass !== "string") {
			// Not in my house
			reject();
			return;
		}

		db["users"].findOne({ user, pass })
			.then((user: User) => {
				if (user) {
					resolve(user);
				} else {
					reject();
				}
			});
	});
}