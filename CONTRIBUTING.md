# How to Contribute

Contributions to DungeonKit are very welcome, and I'd like to make them as easy as possible!  However, for the sake of
my sanity and readable code, please follow the follow the following guidelines when contributing to DungeonKit.

## How to Prepare

- Start by getting a [GitHub](https://github.com/) account if you don't have one already.
- Submit an [issue](https://github.com/bluepichu/dungeonkit/issues) for your problem if one doesn't already exist.
	- Make sure to tag your issue appropriately - as a bug, question, or suggestion - with the tags provided.
	- Describe the issue and include steps to reproduce it if it's a bug.
	- Mention what version of DungeonKit you're using.
- If you want to fix it yourself, fork this repository.

## Making Changes

- In your forked repository, create a branch for your fix.
	- Name your branch appropriately.  I recommend naming it based off of the issue - so for example, if your changes
		will implement something discussed in issue #17, I recommend naming the branch `iss-17`.
	- Make sure not to work directly on `master`, but to branch off of it.  When you're ready to make your branch in
		your forked repo, you can `git checkout -b <branch-name>` to branch off of master.
- Make sure to stick to existing style guidelines.
	- Note that running with `./run` will run `tslint` on the code with the options specified in `tslint.json`.  Your
		code should pass `tslint` without error.  This includes, among many other things, using smart tabs-style
		indentation (that is, tabs for indentation but spaces for alignment) and limiting lines to 120 characters (with
		a tab having a width of 4 characters).
- Make commits in logical units, and make sure to comment well.
- Make sure nothing is broken from your fixes.
- Make sure to update the documentation as needed.

## Submit Changes

- Push your changes to the branch you created in your forked repository.
- Open a [pull request](https://github.com/bluepichu/dungeonkit/pulls).
	- Make sure you reference the issue or issues you're resolving in your pull request.
- Always make sure someone else reivews, approves, and merges your pull request, even if you have write access.
