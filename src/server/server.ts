"use strict";

import * as log                  from "beautiful-log";
import * as express              from "express";
import * as fs                   from "fs";
import * as http                 from "http";
import * as nconf                from "nconf";
import * as path                 from "path";
import {generate as shortid}     from "shortid";
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

	app.get("/mobile", (req, res) => res.sendFile("client/index.html", { root: path.join(__dirname, "..") }));

	const server: http.Server = app.listen(PORT, function() {
		log.info("Listening on *:" + PORT);
	});

	const io: SocketIO.Server = socketio(server);
	let games: Map<string, string> = new Map();

	io.on("connection", (socket: SocketIO.Socket) => {
		log.logf("<green>+ %s</green>", socket.id);
		games.set(socket.id, shortid());

		socket.on("disconnect", () => {
			log.logf("<red>- %s</red>", socket.id);
			games.delete(socket.id);
		});

		socket.on("error", (err: Error) => log.error(err.stack));

		socket.on("join", (game: string) => {
			games.set(socket.id, game);
			log.logf("<blue>%s --> %s</blue>", socket.id, game);
		});

		socket.on("start", () => {
			log.logf("<cyan>S %s</cyan>", socket.id);

			if (!games.has(socket.id)) {
				return;
			}

			let game = games.get(socket.id);
			let socketIds: string[] = Object.keys(io.sockets.sockets).filter((socket) => games.get(socket) === game);

			if (socketIds.length === 0) {
				return;
			}

			let sockets: SocketIO.Socket[] = socketIds.map((id) => io.sockets.connected[id]);
			let players: Game.Crawl.UnplacedCrawlEntity[] = sockets.map(generatePlayer);

			socketIds.forEach((socket) => games.delete(socket));
			players.forEach((player) => player.controller.init(player, dungeon));

			crawl.startCrawl(dungeon, players)
				.then((state) => log.logf("<blue>%s %s</blue>", state.success ? "✓" : "✗", socket.id))
				.catch((err) => log.error(err));
		});
	});
}