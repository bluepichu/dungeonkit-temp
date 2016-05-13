all: install clean build

clean:
	rm -rf build

install: package.json typings.json
	npm install
	typings install

build: src/**/*.*
	cp -r src build
	gulp
	rm -f build/**/*.ts