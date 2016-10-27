"use strict";

import isMobile from "./is-mobile";

export default {
	GRID_SIZE: 24,
	WALK_SPEED: isMobile() ? 3.2 : 1.6,
	VIEW_MOVE_VELOCITY: 1.1,
	VIEW_ZOOM_VELOCITY: 1.1
};