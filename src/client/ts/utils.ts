"use strict";

export function getTile(map: Game.Crawl.Map, location: Game.Crawl.Location): Game.Crawl.DungeonTile {
	return map.grid[location.r][location.c];
}

export function locationToCoordinates(location: Game.Crawl.Location, gridSize: number): [number, number] {
	return [location.c * gridSize, location.r * gridSize];
}

/**
 * Constructs a new list with the given length using the given function to produce each element.
 * @param fn - The function used to produce the elements of the list, which must take a single parameter - the index.
 * @param length - The length of the resulting list (rounded down and set to 0 if negative).
 * @returns The list.
 */
export function tabulate<T>(fn: (i: number) => T, length: number): T[] {
	let ret: T[] = [];

	length = Math.floor(length);

	for (let i = 0; i < length; i++) {
		ret.push(fn(i));
	}

	return ret;
}