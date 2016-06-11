"use strict";

export class TweenHandler {
	private tweens: Tween[];

	constructor() {
		this.tweens = [];
	}

	tween(obj: any, key: string, target: number, velocity: number, type?: "linear" | "smooth"): Thenable {
		this.tweens = this.tweens.filter((tween) => tween.object !== obj || tween.key !== key);
		return new Promise((resolve, reject) => {
			this.tweens.push(new Tween(obj, key, target, velocity, type, resolve));
		});
	}

	step() {
		this.tweens = this.tweens.filter((tween) => tween.step());
	}
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
			if (Math.abs(this.object[this.key] - this.target) < .1) {
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