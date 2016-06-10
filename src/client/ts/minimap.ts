"use strict";

import * as Colors from "./colors";
import * as utils  from "./utils";

export class MiniMap extends PIXI.Container {
	mask: PIXI.Graphics;
	background: PIXI.Graphics;
	content: PIXI.Graphics;
	maskWidth: number;
	maskHeight: number;
	gridSize: number;

	constructor(width: number, height: number) {
		super();

		this.maskWidth = width;
		this.maskHeight = height;

		this.mask = new PIXI.Graphics();
		this.mask.beginFill(0x000000);
		this.mask.drawRect(0, 0, width, height);
		this.mask.endFill();

		this.background = new PIXI.Graphics();
		this.background.mask = this.mask;
		this.drawBackground();

		this.content = new PIXI.Graphics();
		this.content.mask = this.mask;

		this.addChild(this.mask);
		this.addChild(this.content);

		this.gridSize = 8;
	}

	private drawBackground(): void {
		this.background.clear();
		this.background.beginFill(Colors.BLACK);
		this.background.drawRect(0, 0, this.mask.width, this.mask.height);
	}

	resize(width: number, height: number): void {
		if (this.maskWidth !== width || this.height !== height) {
			this.mask.clear();
			this.mask.beginFill(0x000000);
			this.mask.drawRect(0, 0, width, height);
			this.mask.endFill();

			this.drawBackground();

			this.content.x += (width - this.maskWidth) / 2;
			this.content.y += (height - this.maskHeight) / 2;

			this.maskWidth = width;
			this.maskHeight = height;
		}
	}

	update(state: Game.Client.CensoredClientCrawlState): void {
		this.clear();

		for (let i = 0; i < state.floor.map.height; i++) {
			for (let j = 0; j < state.floor.map.width; j++) {
				if (utils.getTile(state.floor.map, { r: i, c: j }).type === Game.Crawl.DungeonTileType.FLOOR) {
					this.content.beginFill(state.floor.map.grid[i][j].roomId === undefined ? Colors.DARK_GRAY : Colors.MID_GRAY);

					this.content.drawRect(this.gridSize * j,
					                         this.gridSize * i,
											 this.gridSize,
											 this.gridSize);

					this.content.endFill();

					this.content.beginFill(0x202020);

					if (0 <= i - 1
					 && utils.getTile(state.floor.map, { r: i - 1, c: j }).type === Game.Crawl.DungeonTileType.UNKNOWN) {
						this.content.drawRect(this.gridSize * j,
						                         this.gridSize * i,
												 this.gridSize,
												 this.gridSize * .25);
					}

					if (0 <= j - 1
					 && utils.getTile(state.floor.map, { r: i, c: j - 1 }).type === Game.Crawl.DungeonTileType.UNKNOWN) {
						this.content.drawRect(this.gridSize * j,
						                         this.gridSize * i,
												 this.gridSize * .25,
												 this.gridSize);
					}

					if (i + 1 < state.floor.map.height
					 && utils.getTile(state.floor.map, { r: i + 1, c: j }).type === Game.Crawl.DungeonTileType.UNKNOWN) {
						this.content.drawRect(this.gridSize * j,
							                     this.gridSize * (i + .75),
												 this.gridSize,
												 this.gridSize * .25);
					}

					if (j + 1 < state.floor.map.width
					 && utils.getTile(state.floor.map, { r: i, c: j + 1 }).type === Game.Crawl.DungeonTileType.UNKNOWN) {
						this.content.drawRect(this.gridSize * (j + .75),
						                         this.gridSize * i,
												 this.gridSize * .25,
												 this.gridSize);
					}

					this.content.endFill();

					if (state.floor.map.grid[i][j].stairs) {
						this.content.lineStyle(1, 0x6a9fb5);

						this.content.drawRect(this.gridSize * j + 1,
						                         this.gridSize * i + 1,
												 this.gridSize - 2,
						                         this.gridSize - 2);

						this.content.lineStyle(0);
					}
				}
			}
		}

		state.entities.forEach((entity: Game.Crawl.CensoredCrawlEntity) => {
			this.content.beginFill(entity.id === state.self.id
				? Colors.WHITE
				: (entity.alignment === state.self.alignment
					? Colors.YELLOW
					: Colors.RED));

			this.content.drawCircle((entity.location.c + .5) * this.gridSize,
			                           (entity.location.r + .5) * this.gridSize,
			                           this.gridSize / 2 - 1);

			this.content.endFill();

			if (entity.id === state.self.id) {
				this.content.x = this.maskWidth / 2 - (entity.location.c + .5) * this.gridSize;
				this.content.y = this.maskHeight / 2 - (entity.location.r + .5) * this.gridSize;
			}
		});
	}

	clear(): void {
		this.content.clear();
	}
}