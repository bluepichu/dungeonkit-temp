"use strict";

let tweens: Tween[] = [];

export function tween(obj: any, properties: any, velocity: number, type?: "linear" | "smooth"): Thenable {
	// Fire the completion event for all tweens that will be deleted
	tweens
		.filter((tween) => tween.object === obj && tween.onComplete !== undefined)
		.forEach((tween) => tween.onComplete());

	// Delete tweens that conflict with the new one
	tweens = tweens.filter((tween) => tween.object !== obj);

	// Add the new tweens
	let promises: Thenable[] = [];

	for (let key in properties) {
		promises.push(new Promise((resolve, reject) => {
			tweens.push(new Tween(obj, key, properties[key], velocity, type, resolve));
		}));
	}

	return Promise.all(promises);
}

export function step() {
	tweens = tweens.filter((tween) => tween.step());
}

type TweenType = "linear" | "smooth";

class Tween {
	public object: any;
	public key: string;
	public target: number;
	public velocity: number;
	public type: TweenType;
	public onComplete: Function;

	constructor(obj: any, key: string, target: number, velocity: number, type?: TweenType, onComplete?: Function) {
		this.object = obj;
		this.key = key;
		this.target = target;
		this.velocity = velocity;
		this.onComplete = onComplete;
		this.type = type || "linear";
	}

	step(): boolean {
		if (this.type === "linear") {
			if (Math.abs(this.object[this.key] - this.target) < this.velocity) {
				this.object[this.key] = this.target;

				if (this.onComplete) {
					this.onComplete();
				}

				return false;
			} else {
				if (this.object[this.key] > this.target) {
					this.object[this.key] -= this.velocity;
				} else {
					this.object[this.key] += this.velocity;
				}

				return true;
			}
		}

		if (this.type === "smooth") {
			if (Math.abs(this.object[this.key] - this.target) < .001) {
				this.object[this.key] = this.target;

				if (this.onComplete) {
					this.onComplete();
				}

				return false;
			} else {
				this.object[this.key] = (this.object[this.key] + this.target * (this.velocity - 1)) / this.velocity;

				return true;
			}
		}
	}
}