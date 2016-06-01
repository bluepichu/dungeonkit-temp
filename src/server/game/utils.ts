"use strict";

import {sprintf} from "sprintf-js";

/**
 * Converts a direction number into a number tuple that describes the direction.
 * @param direction - The number of the direction to decode.
 * @returns A number tuple describing the direction, in the form [dr, dc].
 * @throws {Error} Will throw an error if direction is not an integer.
 */
export function decodeDirection(direction: number): [number, number] {
	switch (((direction % 8) + 8) % 8) {
		case 0:
			return [0, 1];
		case 1:
			return [-1, 1];
		case 2:
			return [-1, 0];
		case 3:
			return [-1, -1];
		case 4:
			return [0, -1];
		case 5:
			return [1, -1];
		case 6:
			return [1, 0];
		case 7:
			return [1, 1];
		default:
			throw new Error(sprintf("[Code 4] %d is not a valid direction.", direction));
	}
}

/**
 * Checks two locations for equality.
 * @param a - The first location.
 * @param b - The second location.
 * @returns Whether or not the two locations are equal.
 */
export function areLocationsEqual(a: Game.Crawl.Location, b: Game.Crawl.Location): boolean {
	return (a.r === b.r) && (a.c === b.c);
}

/**
 * Retrieves the entity at the given location.
 * @param state - The state.
 * @param location - The location.
 * @returns The entity at the given location in the given state, or undefined if no entity occupies that location.
 */
export function getEntityAtLocation(state: Game.Crawl.InProgressCrawlState,
	                                location: Game.Crawl.Location): Game.Crawl.CrawlEntity | void;
export function getEntityAtLocation(state: Game.Crawl.CensoredInProgressCrawlState,
                                    location: Game.Crawl.Location): Game.Crawl.CensoredCrawlEntity | void;

export function getEntityAtLocation(state: Game.Crawl.InProgressCrawlState,
                                    location: Game.Crawl.Location): Game.Crawl.CrawlEntity | void {
	for (let i = 0; i < state.entities.length; i++) {
		if (areLocationsEqual(location, state.entities[i].location)) {
			return state.entities[i];
		}
	}

	return undefined;
}

/**
 * Checks if no entity is occupying the given location.
 * @param state - The state.
 * @param location - The location.
 * @returns Whether or not the location is empty in the given state.
 */
export function isLocationEmpty(state: Game.Crawl.CensoredInProgressCrawlState,
                                location: Game.Crawl.Location): boolean {
	return (getEntityAtLocation(state, location) === undefined);
}

/**
 * Checks if the given location is valid for the given map.
 * @param map - The map.
 * @param location - The location.
 * @returns Whether or not the location is valid for the given map.
 */
export function isLocationInMap(map: Game.Crawl.Map, location: Game.Crawl.Location): boolean {
	return isValidLocation(location) && location.r < map.height && location.c < map.width;
}

/**
 * Checks if the given state represents a crawl that has concluded.
 * @param state - The state.
 * @returns Whether or not the crawl is over.
 */
export function isCrawlOver(state: Game.Crawl.CrawlState): state is Game.Crawl.ConcludedCrawlState {
	return "success" in state;
}

/**
 * Returns the first value so that it is within the bounds described by the other two.  In other words, if v > max,
 * returns v, if v < min, returns min, and otherwise returns v.
 * @param v - The value to bound.
 * @param min - The minimum return value.
 * @param max - The maximum return value.
 * @returns The value, bounded as described.
 * @throws {RangeError} Will throw an error if min > max.
 */
export function bound(v: number, min: number, max: number): number {
	if (min > max) {
		throw new RangeError(sprintf("[Code 5] Max (%d) is less than min (%d).", max, min));
	}

	if (v < min) {
		return min;
	}

	if (v > max) {
		return max;
	}

	return v;
}

/**
 * Returns a random integer between min and max, inclusive on both ends.
 * @param min - The minimum return value.
 * @param max - The maximum return value.
 * @returns A random integer between minimum and maximum, inclusive on both ends.
 * @throws {RangeError} Will throw an error if min > max.
 */
export function randint(min: number, max: number): number {
	if (min > max) {
		throw new RangeError(sprintf("[Code 5] Max (%d) is less than min (%d).", max, min));
	}

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns the (Manhattan) distance between two locations.
 * @param a - The first location.
 * @param b - The second location.
 * @returns The (Manhattan) distance between the two locations.
 */
export function distance(a: Game.Crawl.Location, b: Game.Crawl.Location): number {
	return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
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

/**
 * Checks if the given location is within a room in the given map.
 * @param map - The map.
 * @param location - The location.
 * @returns Whether or not the location is in a room.
 */
export function isLocationInRoom(map: Game.Crawl.Map, location: Game.Crawl.Location) {
	return isLocationInMap(map, location) && map.grid[location.r][location.c].roomId > 0;
}

/**
 * Checks if both given locations are in the same room in the given map.
 * @param map - The map.
 * @param a - The first location.
 * @param b - The second location.
 * @returns Whether or not the two locations are in the same room.
 */
export function inSameRoom(map: Game.Crawl.Map, a: Game.Crawl.Location, b: Game.Crawl.Location): boolean {
	return isLocationInRoom(map, a)
	    && isLocationInRoom(map, b)
	    && map.grid[a.r][a.c].roomId === map.grid[b.r][b.c].roomId;
}

/**
 * Returns whether or not the given value is within the given range, inclusive on the low side and exclusive on the high
 *     side.
 * @param v - The value to check.
 * @param min - The minimum value of the range.
 * @param max - The maximum vlaue of the range.
 * @returns Whether or not v is in the range [min, max).
 */
export function inRange(v: number, min: number, max: number): boolean {
	return min <= v && v < max;
}

/**
 * Checks whether or not the given location would be visible in the given map if standing at the given observation
 *     location.
 * @param map - The map.
 * @param observer - The observation location.
 * @param location - The location to check.
 */
export function isVisible(map: Game.Crawl.Map,
                          observer: Game.Crawl.Location,
                          location: Game.Crawl.Location): boolean {
	return isValidLocation(observer)
	       && isValidLocation(location)
	       && ((isLocationInRoom(map, observer) && inSameRoom(map, observer, location))
	          || distance(observer, location) <= 2);
}

/**
 * Checks whether or not the given location is valid; that is, its row and column are both non-negative integers.
 * @param location - The location to check.
 * @returns Whether or not location is valid.
 */
export function isValidLocation(location: Game.Crawl.Location): boolean {
	return location.r >= 0 && location.c >= 0 && Number.isInteger(location.r) && Number.isInteger(location.c);
}

/**
 * Checks whether or not two entities are aligned.
 * @param a - The first entity.
 * @param b - The second entity.
 * @returns Whether or not the two entities are aligned.
 */
export function areAligned(a: Game.Crawl.CensoredCrawlEntity, b: Game.Crawl.CensoredCrawlEntity): boolean {
	return a.alignment !== 0 && a.alignment === b.alignment;
}