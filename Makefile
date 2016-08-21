all: install clean build

clean:
	rm -rf build

install: package.json typings.json
	-npm install
	-typings install
	-bower install

build: install
	gulp