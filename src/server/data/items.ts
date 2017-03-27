"use strict";

import * as crawl from "../logic-layer/crawl";

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

export let reviverSeed: ItemBlueprint = {
	name: "Reviver Seed",
	description: "Revives the user on defeat.  Fills the belly slightly when eaten.",
	graphics: "item-seed",
	actions: {
		use: ["eat", "use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		entityDefeat(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]) {
			entity.stats.hp.current = entity.stats.hp.max;
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> was revived by the <item>Reviver Seed</item>!`
			}, eventLog);
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `The <item>Reviver Seed</item> turned into a <item>Plain Seed</item>!`
			}, eventLog);
			item.name = "Plain Seed";
			item.description = "Does nothing in particular.  Fills the belly slightly when eaten.";
			item.handlers = { use: item.handlers.use };
		},
		use(entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]) {
			let newBelly = Math.min(entity.stats.belly.current + 60, entity.stats.belly.max);

			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "belly",
				change: newBelly - entity.stats.belly.current
			}, eventLog);
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> ate the <item>Reviver Seed</item>!`
			}, eventLog);

			entity.stats.belly.current = newBelly;
		}
	}
};

export let oranBerry: ItemBlueprint = {
	name: "Oran Berry",
	description: "A sweet berry.  Heals 20 HP and fills the belly slightly when eaten.",
	graphics: "item-berry",
	actions: {
		use: ["eat", "use"],
		drop: ["drop"],
		throw: ["throw"]
	},
	handlers: {
		[ItemHook.ITEM_USE](entity: CrawlEntity, state: InProgressCrawlState, item: Item, held: boolean, eventLog: LogEvent[]) {
			crawl.propagateLogEvent(state, {
				type: "message",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				message: `<self>${entity.name}</self> ate the <item>Oran Berry</item>!`
			}, eventLog);

			let newHp = Math.min(entity.stats.hp.max, entity.stats.hp.current + 20);
			let newBelly = Math.min(entity.stats.belly.max, entity.stats.belly.current + 90);

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

			crawl.propagateLogEvent(state, {
				type: "stat",
				entity: {
					id: entity.id,
					name: entity.name,
					graphics: entity.graphics
				},
				location: entity.location,
				stat: "belly",
				change: newBelly - entity.stats.belly.current
			}, eventLog);

			entity.stats.hp.current = newHp;
			entity.stats.belly.current = newBelly;
		}
	}
};

export let antidefenseScarf: ItemBlueprint = {
	name: "Antidefense Scarf",
	description: "Why did you equip this?!?",
	graphics: "item-scarf",
	equip(entity: UnplacedCrawlEntity) {
		return deepProxy(entity, "stats.defense.modifier", {
			get(target: BaseModifierStat, field: any): number {
				return target.modifier - 6;
			},
			set(target: BaseModifierStat, field: any, value: number): boolean {
				target.modifier += value - target.modifier;
				return true;
			}
		});
	},
	handlers: {},
	actions: {
		drop: ["drop"]
	}
};