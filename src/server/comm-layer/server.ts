"use strict";

import * as express          from "express";
import * as fs               from "fs";
import * as http             from "http";
import * as kue              from "kue";
import * as net              from "net";
import * as path             from "path";
import {generate as shortid} from "shortid";
import * as redis            from "redis";
import * as socketio         from "socket.io";
import * as socketioRedis    from "socket.io-redis";

import { generatePlayer }    from "../data/player";
import { scene, alphaScene } from "../data/overworld";

import CommController        from "./comm-controller";
import * as login            from "./login";

const log = require("beautiful-log")("dungeonkit:comm-server", { showDelta: false });
const redisClient = redis.createClient();

interface GameInfo {
	room: string;
	name: string;
}

const controllerMap: Map<String, CommController> = new Map<String, CommController>();

/**
 * Starts this comm node.
 * @param queue - The job queue.
 */
export function start(queue: kue.Queue) {
	const app: express.Express = express();

	app.use("/", express.static(path.join(__dirname, "../../client")));

	app.get("/mobile", (req, res) => res.sendFile("client/index.html", { root: path.join(__dirname, "..") }));

	const server: http.Server = app.listen(0, "localhost", () => {
		log("Comm server is up");
	});

	const io: SocketIO.Server = socketio(server);

	io.adapter(socketioRedis());

	io.on("connection", (socket: SocketIO.Socket) => {
		log(`<green>+ ${socket.id}</green>`);
		redisClient.hincrby(`comm_${process.env["worker_index"]}_stats`, "connections", 1);

		let player = generatePlayer();
		controllerMap.set(socket.id, new CommController(socket, queue, player));

		socket.on("disconnect", () => {
			log(`<red>- ${socket.id}</red>`);
			redisClient.hincrby(`comm_${process.env["worker_index"]}_stats`, "connections", -1);
			controllerMap.delete(socket.id);
		});

		socket.on("error", (err: Error) => log(err));

		socket.on("start", () => {
			log(`<magenta>S ${socket.id}</magenta>`);
			let controller = controllerMap.get(socket.id);
			controller.initOverworld(controller.user ? alphaScene : scene);
		});

		socket.on("login", (user: string, pass: string) => {
			login.checkLogin(user, pass)
				.then((user) => {
					controllerMap.get(socket.id).user = user;
					io.emit("feed", { type: "login", user: user.display, id: socket.id });
				})
				.catch(() => {
					// Do nothing
				});
		})
	});

	process.on("message", (message: string, connection: net.Socket) => {
		if (message !== "sticky-session:connection") {
			return;
		}

		server.emit("connection", connection);
		connection.resume();
	})

	process.on('unhandledRejection', (reason: string) => {
		log.error("Unhandled promise rejection:", reason);
	});

	queue.process("out", 2, (job: kue.Job, done: () => void) => {
		let { socketId, message } = job.data;
		let controller = controllerMap.get(socketId);
		if (controller === undefined) {
			log("No controller for socketId", socketId);
		} else {
			controller.receive(message);
		}
		done();
	});
}