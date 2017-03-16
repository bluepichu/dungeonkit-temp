"use strict";

import * as cluster     from "cluster";
import * as nconf       from "nconf";
import * as net         from "net";
import * as RedisSMQ    from "rsmq";
import * as sourcemap   from "source-map-support";

nconf.argv().env();

const numCommNodes = nconf.get("comm") || 1;
const numLogicNodes = nconf.get("logic") || 1;

let workers: cluster.Worker[] = [];

sourcemap.install();

if (cluster.isMaster) {
	const log  = require("beautiful-log")("dungeonkit:base", { color: "red", showDelta: false });

	log("Starting master");
	const PORT: number = nconf.get("port") || 6918;

	const rsmq = new RedisSMQ({ host: "127.0.0.1", port: 6379, ns: "rsmq" });

	createQueues(log, rsmq).then(() => {
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
	});
} else {
	let workerIndex = parseInt(nconf.get("worker_index"));

	if (workerIndex < numCommNodes) {
		require("./comm-layer/server").start();
	} else {
		require("./logic-layer/server").start();
	}
}

function createQueues(log: { error: (...args: any[]) => void }, rsmq: RedisSMQ.Client): Promise<{}> {
	return new Promise((resolve, reject) => {
		rsmq.createQueue({ qname: "in", maxsize: -1 }, (err, resp) => {
			if (resp === 1 || err.name === "queueExists") {
				rsmq.createQueue({ qname: "out", maxsize: -1 }, (err, resp) => {
					if (resp === 1 || err.name === "queueExists") {
						resolve();
					} else {
						log.error(err);
						reject(err);
					}
				});
			} else {
				log.error(err);
				reject(err);
			}
		});
	})
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
	workers[idx] = cluster.fork();

	workers[idx].on("exit", (code, signal) => {
		spawnLogicNode(log, idx);
	})
}

// function(ip: string, len: number) {
// 	var s = '';
// 	for (var i = 0, _len = ip.length; i < _len; i++) {
// 		if (!isNaN(ip[i])) {
// 			s += ip[i];
// 		}
// 	}

// 	return Number(s) % len;
// }