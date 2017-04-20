"use strict";

import * as crawl from "../logic-layer/crawl";
import * as utils from "../../common/utils";

type DeepProxyHandler = {
	get?(target: any, field: string | number | symbol): any,
	set?(target: any, field: string | number | symbol, value: any): void
};

function deepProxy<T>(obj: T, field: string, handler: DeepProxyHandler): T {
	function makeProxy(obj: T, [field, ...fields]: string[], handler: DeepProxyHandler): T {
		if (fields.length === 0) {
			let proxy: ProxyHandler<T> = { get: undefined, set: undefined };

			if (handler.get !== undefined) {
				proxy.get = (t: T, f: string | number | symbol) => f === field ? handler.get(t, f) : (t as any)[f];
			}

			if (handler.set !== undefined) {
				proxy.set = (t: T, f: string | number | symbol, v: any) => {
					if (f === field) {
						handler.set(t, f, v);
					} else {
						(t as any)[f] = v;
					}
					return true;
				};
			}

			return new Proxy(obj, proxy);
		}

		let innerProxy = makeProxy((obj as any)[field], fields, handler);

		return new Proxy(obj, {
			get(t: any, f: string | number | symbol) {
				if (f === field) {
					return innerProxy;
				}

				return (t as any)[f];
			}
		}) as T;
	};

	return makeProxy(obj, field.split("."), handler);
}

export let spareParts: ItemBlueprint = {
	name: "Spare Parts",
	description: "Revives the user on defeat.",
	graphics: "item-spare-parts",
	actions: {
		use: ["use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		entityDefeat(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void {
			entity.stats.hp.current = entity.stats.hp.max;
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> was revived by the <item>Spare Parts</item>!`
			}, eventLog);

			if (held) {
				entity.items.held.items = entity.items.held.items.filter((heldItem) => item !== heldItem);
			} else {
				entity.items.bag.items = entity.items.bag.items.filter((bagItem) => item !== bagItem);
			}
		},

		use(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]) {
			// doesn't do anything
		}
	}
};

export let paprika: ItemBlueprint = {
	name: "Paprika",
	description: "Afflicts the \"confused\" status effect when consumed or thrown.",
	graphics: "item-paprika",
	actions: {
		use: ["eat", "use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		use(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> used the <item>Paprika</item>!`
			}, eventLog);

			crawl.propagateLogEvent(state, {
				type: "status_affliction",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				status: StatusCondition.CONFUSED
			}, eventLog);

			entity.status.push(StatusCondition.CONFUSED);
		},

		collide(entity: CrawlEntity, state: InProgressCrawlState, item: Item, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<enemy>${entity.name}</enemy> was hit by the <item>Paprika</item>!`
			}, eventLog);

			crawl.propagateLogEvent(state, {
				type: "status_affliction",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				status: StatusCondition.CONFUSED
			}, eventLog);

			entity.status.push(StatusCondition.CONFUSED);
		}
	}
};

export let cayenne: ItemBlueprint = {
	name: "Cayenne",
	description: "Afflicts the \"short-circuited\" status effect when consumed or thrown.",
	graphics: "item-cayenne",
	actions: {
		use: ["eat", "use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		use(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> used the <item>Paprika</item>!`
			}, eventLog);

			if (entity.attributes.indexOf(Attribute.IMMUNE_TO_SHORT_CIRCUIT) >= 0) {
				crawl.propagateLogEvent(state, {
					type: "message",
					entity: {
						id: entity.id,
						name: entity.name,
						graphics: entity.graphics
					},
					message: `<self>${entity.name}</self> is immune to short-circuiting!`
				}, eventLog);
			} else {
				crawl.propagateLogEvent(state, {
					type: "status_affliction",
					entity: {
						id: entity.id,
						name: entity.name,
						graphics: entity.graphics
					},
					status: StatusCondition.SHORT_CIRCUITED
				}, eventLog);
			}

			entity.status.push(StatusCondition.SHORT_CIRCUITED);
		},

		collide(entity: CrawlEntity, state: InProgressCrawlState, item: Item, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<enemy>${entity.name}</enemy> was hit by the <item>Paprika</item>!`
			}, eventLog);

			if (entity.attributes.indexOf(Attribute.IMMUNE_TO_SHORT_CIRCUIT) >= 0) {
				crawl.propagateLogEvent(state, {
					type: "message",
					entity: {
						id: entity.id,
						name: entity.name,
						graphics: entity.graphics
					},
					message: `<enemy>${entity.name}</enemy> is immune to short-circuiting!`
				}, eventLog);
			} else {
				crawl.propagateLogEvent(state, {
					type: "status_affliction",
					entity: {
						id: entity.id,
						name: entity.name,
						graphics: entity.graphics
					},
					status: StatusCondition.SHORT_CIRCUITED
				}, eventLog);
			}

			entity.status.push(StatusCondition.SHORT_CIRCUITED);
		}
	}
};

export let peppercorn: ItemBlueprint = {
	name: "Peppercorn",
	description: "Afflicts the \"poisoned\" status effect when consumed or thrown.",
	graphics: "item-peppercorn",
	actions: {
		use: ["eat", "use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		use(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> used the <item>Peppercorn</item>!`
			}, eventLog);

			crawl.propagateLogEvent(state, {
				type: "status_affliction",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				status: StatusCondition.POISONED
			}, eventLog);

			entity.status.push(StatusCondition.POISONED);
		},

		collide(entity: CrawlEntity, state: InProgressCrawlState, item: Item, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<enemy>${entity.name}</enemy> was hit by the <item>Peppercorn</item>!`
			}, eventLog);

			crawl.propagateLogEvent(state, {
				type: "status_affliction",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				status: StatusCondition.POISONED
			}, eventLog);

			entity.status.push(StatusCondition.POISONED);
		}
	}
};

export let turmeric: ItemBlueprint = {
	name: "Turmeric",
	description: "Boosts the user's defense.",
	graphics: "item-peppercorn",
	actions: {
		use: ["eat", "use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		use(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> used the <item>Turmeric</item>!`
			}, eventLog);

			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "defense",
				change: 2
			}, eventLog);

			entity.stats.defense.modifier += 2;
		},

		collide(entity: CrawlEntity, state: InProgressCrawlState, item: Item, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<enemy>${entity.name}</enemy> was hit by the <item>Turmeric</item>!`
			}, eventLog);

			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "defense",
				change: 2
			}, eventLog);

			entity.stats.defense.modifier += 2;
		}
	}
};

export let oregano: ItemBlueprint = {
	name: "Oregano",
	description: "Boosts the user's attack.",
	graphics: "item-peppercorn",
	actions: {
		use: ["eat", "use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		use(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> used the <item>Oregano</item>!`
			}, eventLog);

			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "attack",
				change: 2
			}, eventLog);

			entity.stats.attack.modifier += 2;
		},

		collide(entity: CrawlEntity, state: InProgressCrawlState, item: Item, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<enemy>${entity.name}</enemy> was hit by the <item>Oregano</item>!`
			}, eventLog);

			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "attack",
				change: 2
			}, eventLog);

			entity.stats.attack.modifier += 2;
		}
	}
};

export let cinnamon: ItemBlueprint = {
	name: "Cinnamon",
	description: "Lowers the user's attack.",
	graphics: "item-cinnamon",
	actions: {
		use: ["eat", "use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		use(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> used the <item>Cinnamon</item>!`
			}, eventLog);

			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "attack",
				change: -2
			}, eventLog);

			entity.stats.attack.modifier -= 2;
		},

		collide(entity: CrawlEntity, state: InProgressCrawlState, item: Item, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<enemy>${entity.name}</enemy> was hit by the <item>Cinnamon</item>!`
			}, eventLog);

			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "attack",
				change: -2
			}, eventLog);

			entity.stats.attack.modifier -= 2;
		}
	}
};

export let screwdriver: ItemBlueprint = {
	name: "Screwdriver",
	description: "Recovers 40 HP when used.",
	graphics: "item-screwdriver",
	actions: {
		use: ["use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		use(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> used the <item>Screwdriver</item>!`
			}, eventLog);

			let newHp = Math.min(entity.stats.hp.max, entity.stats.hp.current + 40);

			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "hp",
				change: newHp - entity.stats.hp.current
			}, eventLog);

			entity.stats.hp.current = newHp;
		}
	}
};

export let battery: ItemBlueprint = {
	name: "Battery",
	description: "Recovers 50 EN when used.",
	graphics: "item-battery",
	actions: {
		use: ["use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		use(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]): void {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> used the <item>Battery</item>!`
			}, eventLog);

			let newEnergy = Math.min(entity.stats.hp.max, entity.stats.hp.current + 300);

			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "energy",
				change: newEnergy - entity.stats.hp.current
			}, eventLog);

			entity.stats.energy.current = newEnergy;
		}
	}
};

export let salt: ItemBlueprint = {
	name: "Salt",
	description: "Acts as currency.",
	graphics: "item-salt",
	actions: {},
	handlers: {
		pickup(entity: CrawlEntity, state: InProgressCrawlState, item: Item, eventLog: LogEvent[]): boolean {
			entity.salt += item.amount;
			state.items = state.items.filter((it) => it !== item);
			return false;
		}
	}
};