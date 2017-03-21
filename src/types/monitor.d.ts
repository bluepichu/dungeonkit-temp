interface MonitorStats {
	commNodes: CommNodeStats[];
	logicNodes: LogicNodeStats[];
	queues: QueueStats[];
}

interface CommNodeStats {
	id: number;
	connections: number;
}

interface LogicNodeStats {
	id: number;
	throughput: number;
	games: number;
}

interface QueueStats {
	name: string;
	length: number;
}