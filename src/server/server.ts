"use strict";

import * as log                  from "beautiful-log";
import * as express              from "express";
import * as fs                   from "fs";
import * as http                 from "http";
import * as nconf                from "nconf";
import * as path                 from "path";
import * as shortid              from "shortid";
import * as socketio             from "socket.io";
import * as sourcemap            from "source-map-support";
import {sprintf}                 from "sprintf-js";

import * as crawl                from "./game/crawl";
import * as controllers          from "./game/controllers";
import {dungeon, generatePlayer} from "./dungeon";

export function start() {
	sourcemap.install();
	// Error.stackTraceLimit = Infinity;

	nconf.argv().env();

	const app: express.Express = express();
	const PORT: number = nconf.get("port") || 6918;

	app.use(express.static("client"));

	const server: http.Server = app.listen(PORT, function() {
		log.info("Listening on *:" + PORT);
	});

	const io: SocketIO.Server = socketio(server);

	io.on("connection", (socket: SocketIO.Socket) => {
		log.logf("<green>+ %s</green>", socket.id);
		socket.join("waiting");

		socket.on("disconnect", () => log.logf("<red>- %s</red>", socket.id));

		socket.on("error", (err: Error) => log.error(err.stack));

		socket.on("start", () => {
			log.logf("<cyan>S %s</cyan>", socket.id);

			let room = io.sockets.adapter.rooms["waiting"];

			if (room === undefined) {
				return;
			}

			let waiting: { [id: string]: boolean } = room.sockets;
			let socketIds: string[] = Object.keys(waiting).filter((id) => waiting[id]);
			let sockets: SocketIO.Socket[] = socketIds.map((id) => io.sockets.connected[id]);
			let players: Game.Crawl.UnplacedCrawlEntity[] = sockets.map(generatePlayer);

			sockets.forEach((socket) => socket.leave("waiting"));
			players.forEach((player) => player.controller.init(player, dungeon));

			crawl.startCrawl(dungeon, players)
				.then(() => log.logf("<blue>* %s</blue>", socket.id))
				.catch((err) => log.error(err));
		});
	});
}