"use strict";

import { isMobile } from "./is-mobile";

export const GRID_SIZE = 24;
export const WALK_SPEED = isMobile() ? 3.2 : 1.6;
export const VIEW_MOVE_VELOCITY = 1.1;
export const VIEW_ZOOM_VELOCITY = 1.1;