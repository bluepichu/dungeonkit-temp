// Entrypoint for spawning a standalone logic node.

"use strict";

import * as nconf       from "nconf";
import * as kue         from "kue";
import * as sourcemap   from "source-map-support";

sourcemap.install();

let queue = kue.createQueue();

require("./server").start(queue);