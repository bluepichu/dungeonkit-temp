"use strict";

let es2015        = require("babel-preset-es2015");
let gulp          = require("gulp");
let path          = require("path");
let merge         = require("merge-stream");
let notifier      = require("node-notifier");
let rollup        = require("rollup").rollup;
let sorcery       = require("sorcery");

let $             = require("gulp-load-plugins")({ pattern: ["gulp-*", "gulp.*", "main-bower-files"] });

let clientProject = $.typescript.createProject("src/client/tsconfig.json");
let serverProject = $.typescript.createProject("src/server/tsconfig.json");
let testProject   = $.typescript.createProject("test/tsconfig.json");

let src     = (...dirs) => dirs.map((dir) => path.join("src", dir));
let test    = (...dirs) => dirs.map((dir) => path.join("test", dir));
let build   = (dir) => path.join("build", dir);
let map     = "map";
let notify  = (message) => notifier.notify({
			title: "Dungeonkit Build Notice",
			message: message,
			icon: path.join(__dirname, "icon.png")
		});

gulp.task("default", ["client", "server", "test"]);

gulp.task("watch", ["default", "watch-server", "watch-client", "watch-test"]);

gulp.task("watch-client", () => {
	gulp.watch(src("client/**/*.ts", "types/**/*.*", "common/**/*.*"), ["client-ts"]);
	gulp.watch(src("client/index.html"), ["client-html"]);
	gulp.watch(src("client/assets/**/*.*"), ["client-assets"]);
	gulp.watch(src("client/lib/*.js"), ["client-lib"]);
});

gulp.task("client", ["client-html", "client-assets", "client-ts", "client-lib"]);

gulp.task("client-assets", () =>
	gulp.src(src("client/assets/**/*.*"))
	    .pipe(gulp.dest(build("client/assets"))));

gulp.task("client-html", () =>
	gulp.src(src("client/index.html"))
	    .pipe(gulp.dest(build("client"))));

gulp.task("client-ts", () =>
	gulp.src(src("{client/ts/**/*.ts,common/**/*.ts}"))
	    .pipe($.sourcemaps.init())
	    .pipe($.typescript(clientProject))
	    .pipe($.sourcemaps.write(map))
	    .pipe($.intermediate({ output: "out" }, (dir, cb) => {
			rollup({
				entry: path.join(dir, "client/ts/client.js")
			})
				.then((bundle) =>
					bundle.write({
						dest: path.join(dir, "out/client.js"),
						sourceMap: true
			}))
				.then(() => sorcery.load(path.join(dir, "out/client.js")))
				.then((chain) => chain.write(path.join(dir, "out/client.js")))
				.then(() => cb())
				.catch((e) => console.error(dir, "\n", e));
		}))
		.pipe($.ignore.exclude("*.map"))
		.pipe($.sourcemaps.init({ loadMaps: true }))
		.pipe($.babel({ presets: [es2015] }))
		.pipe($.sourcemaps.write(map))
	    .pipe(gulp.dest(build("client/js")).on("end", () => notify("The client is ready!"))));

gulp.task("client-lib", () =>
	merge(gulp.src($.mainBowerFiles())
	          .pipe(gulp.dest(build("client/lib"))),
	      gulp.src(src("client/lib/*.js"))
	          .pipe(gulp.dest(build("client/lib")))));

gulp.task("watch-server", () => {
	gulp.watch(src("server/**/*.ts", "index.ts", "types/**/*.*", "common/**/*.*"), ["server"])
});

gulp.task("server", () =>
	gulp.src(src("{server/**/*.ts,index.ts,common/**/*.ts}"))
	    .pipe($.sourcemaps.init())
	    .pipe($.typescript(serverProject))
	    .pipe($.sourcemaps.write(map))
	    .pipe(gulp.dest(build("")).on("end", () => notify("The server is ready!"))));

gulp.task("watch-test", () => {
	gulp.watch(test("**/*.ts"), ["test"]);
});

gulp.task("test", () =>
	gulp.src(test("**/*.ts"))
	    .pipe($.sourcemaps.init())
	    .pipe($.typescript(testProject))
	    .pipe($.replace("../../src/", "../../"))
	    .pipe($.sourcemaps.write(map))
	    .pipe(gulp.dest(build("test"))));