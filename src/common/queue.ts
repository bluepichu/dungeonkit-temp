"use strict";

export default class Queue<T> {
	private in: T[];
	private out: T[];

	public constructor() {
		this.in = [];
		this.out = [];
	}

	public add(item: T): void {
		this.in.push(item);
	}

	public poll(): T {
		if (this.out.length === 0) {
			while (this.in.length > 0) {
				this.out.push(this.in.pop());
			}
		}

		return this.out.pop();
	}

	public get size(): number {
		return this.in.length + this.out.length;
	}
}