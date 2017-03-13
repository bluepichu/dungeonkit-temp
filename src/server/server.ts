"use strict";

import * as express          from "express";
import * as fs               from "fs";
import * as http             from "http";
import * as nconf            from "nconf";
import * as path             from "path";
import {generate as shortid} from "shortid";
import * as socketio         from "socket.io";
import * as sourcemap        from "source-map-support";

import * as crawl            from "./game/crawl";
import * as controllers      from "./game/controllers";

import { generatePlayer }    from "./data/player";
import { scene }             from "./data/overworld";

const log = require("beautiful-log")("dungeonkit:server", { showDelta: false });

interface GameInfo {
	room: string;
	name: string;
}

export function start() {
	sourcemap.install();
	// Error.stackTraceLimit = Infinity;

	nconf.argv().env();

	const app: express.Express = express();
	const PORT: number = nconf.get("port") || 6918;

	app.use("/", express.static(path.join(__dirname, "../client")));

	app.get("/mobile", (req, res) => res.sendFile("client/index.html", { root: path.join(__dirname, "..") }));

	const server: http.Server = app.listen(PORT, function() {
		log("Listening on *:" + PORT);
	});

	const io: SocketIO.Server = socketio(server);

	io.on("connection", (socket: SocketIO.Socket) => {
		log(`<green>+ ${socket.id}</green>`);

		socket.on("disconnect", () => {
			log(`<red>- ${socket.id}</red>`);
		});

		socket.on("error", (err: Error) => log(err));

		socket.on("start", () => {
			log(`<magenta>S ${socket.id}</magenta>`);

			let player = generatePlayer(socket);
			(player.controller as controllers.SocketController).initOverworld(player, scene); // TODO (bluepichu): figure this out
		});
	});
}

process.on('unhandledRejection', (reason: string) => {
	log.error("Unhandled promise rejection:", reason);
});