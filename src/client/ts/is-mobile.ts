"use strict";

export function isMobile(): boolean {
	return window.location.pathname.substring(0, 7) === "/mobile";
}