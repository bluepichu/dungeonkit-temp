"use strict";

import Colors     from "./colors";
import * as state from "./state";
import * as utils from "../../common/utils";

export default class Minimap extends PIXI.Container {
	private mapMask: PIXI.Graphics;
	private mapBackground: PIXI.Graphics;
	private mapContent: PIXI.Graphics;
	private mapMaskWidth: number;
	private mapMaskHeight: number;
	private gridSize: number;

	constructor(width: number, height: number) {
		super();

		this.mapMaskWidth = width;
		this.mapMaskHeight = height;

		this.mapMask = new PIXI.Graphics();
		this.mapMask.beginFill(0x000000);
		this.mapMask.drawRect(0, 0, width, height);
		this.mapMask.endFill();

		this.mapBackground = new PIXI.Graphics();
		this.mapBackground.mask = this.mapMask;
		this.drawBackground(width, height);

		this.mapContent = new PIXI.Graphics();
		this.mapContent.mask = this.mapMask;

		this.addChild(this.mapMask);
		this.addChild(this.mapBackground);
		this.addChild(this.mapContent);

		this.gridSize = 8;
	}

	private drawBackground(width: number, height: number): void {
		this.mapBackground.clear();
		this.mapBackground.beginFill(Colors.BLACK);
		this.mapBackground.drawRect(0, 0, width, height);
		this.mapBackground.endFill();
	}

	resize(width: number, height: number): void {
		if (this.mapMaskWidth !== width || this.height !== height) {
			this.mapMask.clear();
			this.mapMask.beginFill(0x000000);
			this.mapMask.drawRect(0, 0, width, height);
			this.mapMask.endFill();

			this.drawBackground(width, height);

			this.mapContent.x += (width - this.mapMaskWidth) / 2;
			this.mapContent.y += (height - this.mapMaskHeight) / 2;

			this.mapMaskWidth = width;
			this.mapMaskHeight = height;
		}
	}

	update(): void {
		this.clear();

		for (let i = 0; i < state.getState().floor.map.height; i++) {
			for (let j = 0; j < state.getState().floor.map.width; j++) {
				if (utils.getTile(state.getState().floor.map, { r: i, c: j }).type === DungeonTileType.FLOOR) {
					this.mapContent.beginFill(state.getState().floor.map.grid[i][j].roomId === undefined ? Colors.GRAY_2 : Colors.GRAY_3);

					this.mapContent.drawRect(this.gridSize * j,
					                         this.gridSize * i,
											 this.gridSize,
											 this.gridSize);

					this.mapContent.endFill();

					this.mapContent.beginFill(Colors.GRAY_1);

					if (0 <= i - 1
						&& utils.getTile(state.getState().floor.map, { r: i - 1, c: j }).type === DungeonTileType.UNKNOWN) {
						this.mapContent.drawRect(this.gridSize * j,
						                         this.gridSize * i,
												 this.gridSize,
												 this.gridSize * .25);
					}

					if (0 <= j - 1
					 && utils.getTile(state.getState().floor.map, { r: i, c: j - 1 }).type === DungeonTileType.UNKNOWN) {
						this.mapContent.drawRect(this.gridSize * j,
						                         this.gridSize * i,
												 this.gridSize * .25,
												 this.gridSize);
					}

					if (i + 1 < state.getState().floor.map.height
						&& utils.getTile(state.getState().floor.map, { r: i + 1, c: j }).type === DungeonTileType.UNKNOWN) {
						this.mapContent.drawRect(this.gridSize * j,
							                     this.gridSize * (i + .75),
												 this.gridSize,
												 this.gridSize * .25);
					}

					if (j + 1 < state.getState().floor.map.width
						&& utils.getTile(state.getState().floor.map, { r: i, c: j + 1 }).type === DungeonTileType.UNKNOWN) {
						this.mapContent.drawRect(this.gridSize * (j + .75),
						                         this.gridSize * i,
												 this.gridSize * .25,
												 this.gridSize);
					}

					this.mapContent.endFill();

					if (state.getState().floor.map.grid[i][j].stairs) {
						this.mapContent.lineStyle(1, 0x6a9fb5);

						this.mapContent.drawRect(this.gridSize * j + 1,
						                         this.gridSize * i + 1,
												 this.gridSize - 2,
						                         this.gridSize - 2);

						this.mapContent.lineStyle(0);
					}
				}
			}
		}

		state.getState().entities.forEach((entity: CensoredCrawlEntity) => {
			this.mapContent.beginFill(entity.id === state.getState().self.id
				? Colors.YELLOW
				: (entity.alignment === state.getState().self.alignment
					? Colors.ORANGE
					: Colors.RED));

			this.mapContent.drawCircle((entity.location.c + .5) * this.gridSize,
			                           (entity.location.r + .5) * this.gridSize,
			                           this.gridSize / 2 - 1);

			this.mapContent.endFill();

			if (entity.id === state.getState().self.id) {
				this.mapContent.x = this.mapMaskWidth / 2 - (entity.location.c + .5) * this.gridSize;
				this.mapContent.y = this.mapMaskHeight / 2 - (entity.location.r + .5) * this.gridSize;
			}
		});
	}

	clear(): void {
		this.mapContent.clear();
	}
}