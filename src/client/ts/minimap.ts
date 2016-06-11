"use strict";

import * as Colors from "./colors";
import * as utils  from "./utils";

export class MiniMap extends PIXI.Container {
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

	update(state: Game.Client.CensoredClientCrawlState): void {
		this.clear();

		for (let i = 0; i < state.floor.map.height; i++) {
			for (let j = 0; j < state.floor.map.width; j++) {
				if (utils.getTile(state.floor.map, { r: i, c: j }).type === Game.Crawl.DungeonTileType.FLOOR) {
					this.mapContent.beginFill(state.floor.map.grid[i][j].roomId === undefined ? Colors.DARK_GRAY : Colors.MID_GRAY);

					this.mapContent.drawRect(this.gridSize * j,
					                         this.gridSize * i,
											 this.gridSize,
											 this.gridSize);

					this.mapContent.endFill();

					this.mapContent.beginFill(Colors.DARK_GRAY);

					if (0 <= i - 1
					 && utils.getTile(state.floor.map, { r: i - 1, c: j }).type === Game.Crawl.DungeonTileType.UNKNOWN) {
						this.mapContent.drawRect(this.gridSize * j,
						                         this.gridSize * i,
												 this.gridSize,
												 this.gridSize * .25);
					}

					if (0 <= j - 1
					 && utils.getTile(state.floor.map, { r: i, c: j - 1 }).type === Game.Crawl.DungeonTileType.UNKNOWN) {
						this.mapContent.drawRect(this.gridSize * j,
						                         this.gridSize * i,
												 this.gridSize * .25,
												 this.gridSize);
					}

					if (i + 1 < state.floor.map.height
					 && utils.getTile(state.floor.map, { r: i + 1, c: j }).type === Game.Crawl.DungeonTileType.UNKNOWN) {
						this.mapContent.drawRect(this.gridSize * j,
							                     this.gridSize * (i + .75),
												 this.gridSize,
												 this.gridSize * .25);
					}

					if (j + 1 < state.floor.map.width
					 && utils.getTile(state.floor.map, { r: i, c: j + 1 }).type === Game.Crawl.DungeonTileType.UNKNOWN) {
						this.mapContent.drawRect(this.gridSize * (j + .75),
						                         this.gridSize * i,
												 this.gridSize * .25,
												 this.gridSize);
					}

					this.mapContent.endFill();

					if (state.floor.map.grid[i][j].stairs) {
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

		state.entities.forEach((entity: Game.Crawl.CensoredCrawlEntity) => {
			this.mapContent.beginFill(entity.id === state.self.id
				? Colors.YELLOW
				: (entity.alignment === state.self.alignment
					? Colors.ORANGE
					: Colors.RED));

			this.mapContent.drawCircle((entity.location.c + .5) * this.gridSize,
			                           (entity.location.r + .5) * this.gridSize,
			                           this.gridSize / 2 - 1);

			this.mapContent.endFill();

			if (entity.id === state.self.id) {
				this.mapContent.x = this.mapMaskWidth / 2 - (entity.location.c + .5) * this.gridSize;
				this.mapContent.y = this.mapMaskHeight / 2 - (entity.location.r + .5) * this.gridSize;
			}
		});
	}

	clear(): void {
		this.mapContent.clear();
	}
}