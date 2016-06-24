"use strict";

import {isMobile} from "./is-mobile";

export const WELCOME = "Welcome to <item>DungeonKit</item>!";

export const START_HELP = isMobile()
	? "Do a <command>three-finger tap</command> to start, or a <command>four-finger tap</command> for an explanation of the controls."
	: "Enter the command <command>start</command> to start, or the command <command>help</command> for an explanation of the controls.";

export const CONTROLS = "Here are the controls:\n" + (isMobile()
	? "Use a <command>three-finger tap</command> to start!\n"
	+ "Use a <command>one-finger swipe</command> to move!\n"
	+ "Use a <command>two-finger swipe</command> to dash!\n"
	+ "<attack controls here>!\n"
	+ "<stairs controls here>!"
	: "Use the <command>start</command> command to start!\n"
	+ "Use the <self>arrow keys</self> to move!\n"
	+ "Hold <self>B</self> when moving to dash!\n"
	+ "Hold <self>R</self> when moving to rotate without moving!\n"
	+ "Press <self>shift</self> and a number to use an attack!\n"
	+ "Hold <self>M</self> to view the whole map!\n"
	+ "Use the <command>stairs</command> (or <command>s</command>) command to go up the stairs!");