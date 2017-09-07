# DungeonKit

[banner image goes here]

DungeonKit is a boilerplate of sorts for building Mystery Dungeon-style (that is, grid-based and turn-based) rougelike
games with Javascript (via Node and Typescript).

## What's with the `-temp` in the name?

**This really isn't ready for public consumption.**  I want to do some refactoring and documentation before I try to package it as usable, but I also want to get some of the code out there now.

Do keep in mind that the use of artwork from the Pokemon Mystery Dungeon games is mostly for testing/convenience purposes.  I'm not claiming to have any rights to it; those remain with the creators of those games.

## I'm looking for Toaster Wars.

If you're looking for the Plaid CTF edition of Toaster Wars: Going Rogue, you can find that on the `plaid` branch.

If you're looking for the PicoCTF edition of Toaster Wars, that isn't hosted here (that version of DK predates this repository).  Bug me and I'll release it elsewhere.

## Documentation

For documentation, check out the `doc` folder.

## Installation

I recommend forking this repository into your own if you want to use DungeonKit to make a game.

Once you've pulled down your forked copy of DungeonKit, do the following steps to get DungeonKit running:

- Install Node.
	- Go to [Node's website](https://nodejs.org) and download the latest version for your OS from there.
	- Make sure to also get NPM (which should get downloaded with Node).
- Install the required Node packages.
	- Install `bower`, `typescript`, `typings`, and `gulp` globally.  To do this, run `npm install -g bower typescript typings gulp`.
	- To install all other required Node modules, simply run `npm install`.
- Install the required Typescript bindings: `typings install`.

## Building

To build DungeonKit, run `gulp`.

## Running

You can run DungeonKit with `./run`.

## Licensing

For license information, check out `LICENSING.md`.

## Contributing

For information on how to contribute, check out `CONTRIBUTING.md`.

## Need help?

If you have any questions about DungeonKit, I'd be glad to help you out!  Just file an issue here with the appropriate
tag and I'll take a look.
