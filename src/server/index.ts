"use strict";

import * as cluster     from "cluster";
import * as express     from "express";
import * as http        from "http";
import * as kue         from "kue";
import * as nconf       from "nconf";
import * as net         from "net";
import * as path        from "path";
import * as redis       from "redis";
import * as socketio    from "socket.io";
import * as sourcemap   from "source-map-support";

nconf.argv().env();

const numCommNodes = nconf.get("comm") || 1;
const numLogicNodes = nconf.get("logic") || 1;

let workers: cluster.Worker[] = [];

let queue = kue.createQueue();

sourcemap.install();

if (cluster.isMaster) {
	const log  = require("beautiful-log")("dungeonkit:base", { color: "red", showDelta: false });
	const redisClient = redis.createClient();

	log("Starting master");
	const PORT: number = nconf.get("port") || 6918;

	for (let i = 0; i < numCommNodes; i++) {
		redisClient.hmset(`comm_${i}_stats`, ["connections", 0]);
		spawnCommNode(log, i);
	}

	for (let i = 0; i < numLogicNodes; i++) {
		redisClient.hmset(`logic_${i + numCommNodes}_stats`, ["throughput", 0, "games", 0]);
		spawnLogicNode(log, i + numCommNodes);
	}

	net.createServer({ pauseOnConnect: true } as {}, (connection: net.Socket) => {
		let worker = workers[0]; // TODO
		worker.send("sticky-session:connection", connection);
	}).listen(PORT);

	// Create monitor app
	const app: express.Express = express();
	app.use("/", express.static(path.join(__dirname, "../monitor")));

	const MONITOR_PORT = nconf.get("monitor-port") || 3000;
	const server: http.Server = app.listen(MONITOR_PORT, "localhost", () => {
		log("Monitor server is up");
	});

	const io: SocketIO.Server = socketio(server);

	setInterval(() => {
		log("Sending monitor update");

		let commStatsPrm = Promise.all(Array.from(new Array(numCommNodes), (_, i) => getCommStats(i, redisClient)));
		let logicStatsPrm = Promise.all(Array.from(new Array(numLogicNodes), (_, i) => getLogicStats(i + numCommNodes, redisClient)));
		let queueStatsPrm = getQueueStats();

		Promise.all([commStatsPrm, logicStatsPrm, queueStatsPrm])
			.then(([commNodes, logicNodes, queues]) => {
				let stats: MonitorStats = { commNodes, logicNodes, queues };
				log(stats);
				io.emit("update", stats);
			});
	}, 5000);
} else {
	let workerIndex = parseInt(nconf.get("worker_index"));

	if (workerIndex < numCommNodes) {
		require("./comm-layer/server").start(queue);
	} else {
		require("./logic-layer/server").start(queue);
	}
}

function spawnCommNode(log: (...args: any[]) => void, idx: number): void {
	log("Spawning comm worker", idx);
	let env = Object.assign({}, process.env, { worker_index: idx, comm: numCommNodes, logic: numLogicNodes });
	workers[idx] = cluster.fork(env);

	workers[idx].on("exit", (code, signal) => {
		spawnCommNode(log, idx);
	})
}

function spawnLogicNode(log: (...args: any[]) => void, idx: number): void {
	log("Spawning logic worker", idx);
	let env = Object.assign({}, process.env, { worker_index: idx, comm: numCommNodes, logic: numLogicNodes });
	workers[idx] = cluster.fork(env);

	workers[idx].on("exit", (code, signal) => {
		spawnLogicNode(log, idx);
	})
}

function getCommStats(id: number, redisClient: redis.RedisClient): Promise<CommNodeStats> {
	return new Promise((resolve, reject) => {
		redisClient.hgetall(`comm_${id}_stats`, (err: Error, stats: Object) => {
			resolve(Object.assign(stats, { id }));
		});
	});
}

function getLogicStats(id: number, redisClient: redis.RedisClient): Promise<LogicNodeStats> {
	return new Promise((resolve, reject) => {
		redisClient.hgetall(`logic_${id}_stats`, (err: Error, stats: Object) => {
			redisClient.hset(`logic_${id}_stats`, ["throughput", 0]);
			resolve(Object.assign(stats, { id }));
		});
	});
}

function getQueueStats(): Promise<QueueStats[]> {
	return new Promise((resolve, reject) => {
		queue.types((err: Error, types: string[]) => {
			resolve(Promise.all(types.map((type) =>
				new Promise((res, rej) => queue.activeCount(type, (err: Error, count: number) => res({ name: type, length: count }))))));
		});
	});
}