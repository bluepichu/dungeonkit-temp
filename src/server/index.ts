"use strict";

import * as cluster     from "cluster";
import * as kue         from "kue";
import * as nconf       from "nconf";
import * as net         from "net";
import * as sourcemap   from "source-map-support";

nconf.argv().env();

const numCommNodes = nconf.get("comm") || 1;
const numLogicNodes = nconf.get("logic") || 1;

let workers: cluster.Worker[] = [];

let queue = kue.createQueue();

sourcemap.install();

if (cluster.isMaster) {
	// kue.app.listen(3000);
	const log  = require("beautiful-log")("dungeonkit:base", { color: "red", showDelta: false });

	log("Starting master");
	const PORT: number = nconf.get("port") || 6918;

	for (let i = 0; i < numCommNodes; i++) {
		spawnCommNode(log, i);
	}

	for (let i = 0; i < numLogicNodes; i++) {
		spawnLogicNode(log, i + numCommNodes);
	}

	net.createServer({ pauseOnConnect: true } as {}, (connection: net.Socket) => {
		let worker = workers[0]; // TODO
		worker.send("sticky-session:connection", connection);
	}).listen(PORT);
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
	let env = Object.assign({}, process.env, { worker_index: idx });
	workers[idx] = cluster.fork(env);

	workers[idx].on("exit", (code, signal) => {
		spawnCommNode(log, idx);
	})
}

function spawnLogicNode(log: (...args: any[]) => void, idx: number): void {
	log("Spawning logic worker", idx);
	let env = Object.assign({}, process.env, { worker_index: idx });
	workers[idx] = cluster.fork(env);

	workers[idx].on("exit", (code, signal) => {
		spawnLogicNode(log, idx);
	})
}