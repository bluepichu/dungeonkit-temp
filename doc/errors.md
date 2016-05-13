# Errors

There are several errors in DungeonKit that get passed on to the user, and which they are told to report.  This quick
reference should help you debug them.

## [Code 1] Dungeon blueprint for dungeon '%s' failed validation.

A player tried to enter the specified dungeon and got a validation error.  This error is thrown from `game/crawl.ts`,
but is the result of errors in the game config files.  Check your blueprints for validity.

## [Code 2] Floor %d is out of range for dungeon '%s'.

The game logic attempted to get the blueprint for a floor that isn't within range for a given dungeon.  This should not
be thrown, as this implies the game logic should have either signaled a win condition or that it attempted to access
an invalid floor.  If this error is reported, please make an issue for it with reproduction instructions.

## [Code 3] A blueprint for floor %d was not found in the blueprint for dungeon '%s'.

The game logic was unable to locate a floor blueprint for a particular in-range floor of a dungeon.  This should never
be thrown, as this implies that the blueprint validator failed.  If this error is reported, please make an issue for it
with reproduction instructions.