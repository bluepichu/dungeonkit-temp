"use strict";

import * as log         from "beautiful-log";
import * as express     from "express";
import * as fs          from "fs";
import * as http        from "http";
import * as nconf       from "nconf";
import * as path        from "path";
import * as shortid     from "shortid";
import * as socketio    from "socket.io";
import * as sourcemap   from "source-map-support";
import {sprintf}        from "sprintf-js";

import * as crawl       from "./game/crawl";
import * as controllers from "./game/controllers";

export function start() {
	sourcemap.install();
	// Error.stackTraceLimit = Infinity;

	const app: express.Express = express();
	const PORT: number = nconf.get("port") || 6918;

	let roomFeatures = [
		{
			width: 10,
			height: 10,
			weight: 10,
			grid: [
				"##^#^#####",
				"#     #^##",
				"<        #",
				"<        >",
				"<        #",
				"<        #",
				"<        >",
				"#       ##",
				"##vv#   ##",
				"#######v##"
			],
		},
		{
			width: 10,
			height: 10,
			weight: 10,
			grid: [
				"########^#",
				"###^^#   #",
				"#<       >",
				"##       #",
				"#<       >",
				"#<       >",
				"##       #",
				"<        >",
				"#        #",
				"##vv#vvv##"
			]
		},
		{
			width: 10,
			height: 6,
			weight: 3,
			grid: [
				"####^^####",
				"###    ###",
				"#        #",
				"#        #",
				"###    ###",
				"####vv####",
			]
		},
		{
			width: 10,
			height: 7,
			weight: 4,
			grid: [
				"####^^^###",
				"#^#    ###",
				"<        >",
				"<  #    ##",
				"<      >##",
				"###   ####",
				"####vv####"
			]
		}
	];

	let corridorFeatures = [
		{
			width: 6,
			height: 3,
			weight: 10,
			grid: [
				"######",
				"<    >",
				"######"
			]
		},
		{
			width: 3,
			height: 6,
			weight: 10,
			grid: [
				"#^#",
				"# #",
				"# #",
				"# #",
				"# #",
				"#v#"
			]
		},
		{
			width: 5,
			height: 4,
			weight: 5,
			grid: [
				"##^##",
				"<  ##",
				"##  >",
				"###v#"
			]
		},
		{
			width: 3,
			height: 3,
			weight: 3,
			grid: [
				"#^#",
				"< >",
				"#v#"
			]
		},
		{
			width: 4,
			height: 3,
			weight: 1,
			grid: [
				"####",
				"<  >",
				"####"
			]
		},
		{
			width: 3,
			height: 4,
			weight: 1,
			grid: [
				"#^#",
				"# #",
				"# #",
				"#v#"
			]
		}
	];

	let features = {
		rooms: roomFeatures,
		corridors: corridorFeatures
	};

	function std(pattern: number): Game.Graphics.DungeonTileSelector {
		return {
			pattern: pattern,
			object: {
				type: "static",
				frames: [
					{ texture: sprintf("wall-%02x", pattern), anchor: { x: 12, y: 5 } }
				]
			}
		};
	}

	let graphics: Game.Graphics.DungeonGraphics = {
		base: "dng-proto",
		walls: [
			std(0xff), // surrounded
			std(0x7f), // one direction open
			std(0xbf),
			std(0xdf),
			std(0xef),
			std(0xf7),
			std(0xfb),
			std(0xfd),
			std(0xfe),
			std(0x3e), // one side open
			std(0x8f),
			std(0xe3),
			std(0xf8),
			std(0xe0), // two sides open
			std(0x38),
			std(0x0e),
			std(0x83),
			std(0x22),
			std(0x88),
			std(0x80), // three sides open
			std(0x20),
			std(0x08),
			std(0x02),
			std(0x00)  // island
		],
		open: {
			type: "static",
			frames: [ { texture: "open", anchor: { x: 12, y: 5 } } ]
		},
		stairs: {
			type: "static",
			frames: [ { texture: "stairs", anchor: { x: 12, y: 5 } } ]
		}
	};

	let dungeon: Game.Crawl.Dungeon = {
		name: "Prototypical Forest",
		floors: 10,
		direction: "up",
		difficulty: 3,
		graphics: graphics,
		blueprint: [
			{
				range: [1, 4],
				blueprint: {
					generatorOptions: {
						generator: "feature",
						options: {
							width: {
								min: 40,
								max: 60
							},
							height: {
								min: 40,
								max: 60
							},
							features: features,
							limit: 100000,
							cleanliness: .95
						}
					},
					enemies: []
				}
			},
			{
				range: [5, 8],
				blueprint: {
					generatorOptions: {
						generator: "feature",
						options: {
							width: {
								min: 80,
								max: 100
							},
							height: {
								min: 60,
								max: 80
							},
							features: features,
							limit: 100000,
							cleanliness: .95
						}
					},
					enemies: []
				}
			},
			{
				range: [9, 10],
				blueprint: {
					generatorOptions: {
						generator: "feature",
						options: {
							width: {
								min: 120,
								max: 140
							},
							height: {
								min: 80,
								max: 100
							},
							features: features,
							limit: 100000,
							cleanliness: .95
						}
					},
					enemies: []
				}
			},
		]
	};

	nconf.argv().env();

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

			let waiting: { [id: string]: boolean } = io.sockets.adapter.rooms["waiting"].sockets;
			let socketIds: string[] = Object.keys(waiting).filter((id) => waiting[id]);
			let sockets: SocketIO.Socket[] = socketIds.map((id) => io.sockets.connected[id]);
			let players: Game.Crawl.UnplacedCrawlEntity[] = sockets.map(generatePlayer);

			sockets.forEach((socket) => socket.leave("waiting"));
			players.forEach((player) => player.controller.init(player));

			crawl.startCrawl(dungeon, players)
				.then(() => log.logf("<blue>* %s</blue>", socket.id))
				.catch((err) => log.error(err));
		});
	});

	function generatePlayer(socket: SocketIO.Socket): Game.Crawl.UnplacedCrawlEntity {
		return {
			id: shortid.generate(),
			name: "Mudkip",
			stats: {
				level: 10,
				hp: {
					max: 45,
					current: 45
				},
				attack: {
					base: 30,
					modifier: 0
				},
				defense: {
					base: 30,
					modifier: 0
				}
			},
			attacks: [
				{
					name: "Tackle",
					description: "Charges the foe with a full-body tackle.",
					target: {
						type: "front",
						includeAllies: false
					},
					accuracy: 100,
					power: 50,
					onHit: [

					]
				},
				{
					name: "Growl",
					description: "Growls cutely to reduce the foe's ATTACK.",
					target: {
						type: "room",
						includeAllies: false,
						includeSelf: false
					},
					accuracy: "always",
					power: 0,
					onHit: [
						{
							type: "stat",
							stat: "attack",
							amount: -1
						}
					]
				},
				{
					name: "Water Gun",
					description: "Squirts water to attack the foe.",
					target: {
						type: "front",
						includeAllies: false
					},
					accuracy: 40,
					power: 100,
					onHit: [

					]
				}
			],
			bag: {
				capacity: 16,
				items: [

				]
			},
			controller: new controllers.SocketController(socket),
			alignment: 1,
			advances: true,
			graphics: {
				base: "mudkip",
				object: {
					type: "animated",
					animations: {
						idle: {
							steps: [
								{
									frames: [
										{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 } },
										{ texture: "shadow", anchor: { x: 12, y: 5 } }
									],
									duration: 100
								},
								{
									frames: [
										{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 } },
										{ texture: "shadow", anchor: { x: 12, y: 5 } }
									],
									duration: 10
								},
								{
									frames: [
										{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 } },
										{ texture: "shadow", anchor: { x: 12, y: 5 } }
									],
									duration: 10
								}
							]
						},
						walk: {
							steps: [
								{
									frames: [
										{ texture: "walk-%(dir)da", anchor: { x: 12, y: 15 } },
										{ texture: "shadow", anchor: { x: 12, y: 5 } }
									],
									duration: 4
								},
								{
									frames: [
										{ texture: "walk-%(dir)db", anchor: { x: 12, y: 15 } },
										{ texture: "shadow", anchor: { x: 12, y: 5 } }
									],
									duration: 4
								},
								{
									frames: [
										{ texture: "walk-%(dir)dc", anchor: { x: 12, y: 15 } },
										{ texture: "shadow", anchor: { x: 12, y: 5 } }
									],
									duration: 4
								}
							]
						}
					},
					default: "idle"
				}
			}
		};
	}
}