"use strict";

let gulp    = require("gulp");
let path    = require("path");
let $       = require("gulp-load-plugins")({ pattern: ["gulp-*", "gulp.*", "main-bower-files"] });

let clientProject = $.typescript.createProject("src/client/tsconfig.json");
let serverProject = $.typescript.createProject("src/server/tsconfig.json");

let src     = (dir) => path.join("src", dir);
let build   = (dir) => path.join("build", dir);
let map     = "map";

gulp.task("watch", ["default", "watch-server", "watch-client"]);

gulp.task("default", ["client", "server"])

gulp.task("watch-client", () => {
	gulp.watch(src("{client/**/*.ts, types/**/*.*}"), ["client-ts"]);
	gulp.watch(src("client/index.html"), ["client-html"]);
});

gulp.task("client", ["client-assets", "client-ts", "client-lib"]);

gulp.task("client-assets", () =>
	gulp.src(src("client/**/*.{html,jpg,png}"))
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
	gulp.watch(src("{server/**/*.ts, index.ts, types/**/*.*}"), ["server"])
});

gulp.task("server", () =>
	gulp.src(src("{server/**/*.ts,index.ts}"))
	    .pipe($.sourcemaps.init())
	    .pipe($.typescript(serverProject))
	    .pipe($.sourcemaps.write(map))
	    .pipe(gulp.dest(build(""))));