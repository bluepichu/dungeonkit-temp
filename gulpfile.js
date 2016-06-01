"use strict";

let gulp          = require("gulp");
let path          = require("path");
let $             = require("gulp-load-plugins")({ pattern: ["gulp-*", "gulp.*", "main-bower-files"] });
// let psd           = require("gulp-psd");
// let texturePacker = require('spritesmith-texturepacker');

let clientProject = $.typescript.createProject("src/client/tsconfig.json");
let serverProject = $.typescript.createProject("src/server/tsconfig.json");
let testProject   = $.typescript.createProject("src/test/tsconfig.json");

let src     = (...dirs) => dirs.map((dir) => path.join("src", dir));
let build   = (dir) => path.join("build", dir);
let map     = "map";

gulp.task("watch", ["default", "watch-server", "watch-client", "watch-test"]);

gulp.task("default", ["client", "server", "test"]);

gulp.task("watch-client", () => {
	gulp.watch(src("client/**/*.ts", "types/**/*.*"), ["client-ts"]);
	gulp.watch(src("client/index.html"), ["client-html"]);
	gulp.watch(src("client/assets/**/*.*"), ["client-assets"]);
});

gulp.task("client", ["client-html", "client-assets", "client-ts", "client-lib"]);

gulp.task("client-assets", () =>
	gulp.src(src("client/assets/**/*.*"))
	    .pipe(gulp.dest(build("client/assets"))));

gulp.task("client-html", () =>
	gulp.src(src("client/index.html"))
	    .pipe(gulp.dest(build("client"))));

gulp.task("client-ts", () =>
	gulp.src(src("client/ts/*.ts"))
	    .pipe($.sourcemaps.init())
	    .pipe($.typescript(clientProject))
	    .pipe($.sourcemaps.write(map))
	    .pipe(gulp.dest(build("client/js"))));

gulp.task("client-lib", () =>
	gulp.src($.mainBowerFiles())
	    // .pipe($.uglify())
	    .pipe(gulp.dest(build("client/lib"))));

gulp.task("watch-server", () => {
	gulp.watch(src("server/**/*.ts", "index.ts", "types/**/*.*"), ["server"])
});

gulp.task("server", () =>
	gulp.src(src("{server/**/*.ts,index.ts}"))
	    .pipe($.sourcemaps.init())
	    .pipe($.typescript(serverProject))
	    .pipe($.sourcemaps.write(map))
	    .pipe(gulp.dest(build(""))));

gulp.task("watch-test", () => {
	gulp.watch(src("test/test.ts"), ["test"]);
});

gulp.task("test", () =>
	gulp.src(src("test/test.ts"))
	    .pipe($.sourcemaps.init())
	    .pipe($.typescript(testProject))
	    .pipe($.sourcemaps.write(map))
	    .pipe(gulp.dest(build("test"))));