COLOR = \033[1;33m
COLOR_RESET = \033[0m

default: build

build: build_js

build_native:
	go build ./...

build_js:
	@echo "transpiling chrome extension src..."
	node_modules/.bin/babel --no-comments --minified chrome/src -d chrome/ext
	cp node_modules/sizzle/dist/sizzle.min.js chrome/ext/sizzle.js

watch:
	@echo "auto-building chrome extension src..."
	node_modules/.bin/babel --no-comments -w chrome/src -d chrome/ext

test: test_native test_js

test_js:
	node_modules/.bin/babel --retain-lines chrome/src -d chrome/ext
	@echo "\n$(COLOR)Running Chrome tests...$(COLOR_RESET)"
	@node_modules/.bin/jasmine JASMINE_CONFIG_PATH=chrome/spec/support/jasmine.json
	@echo "\n"

test_native: build_native
	@echo "\n$(COLOR)Running Native tests...$(COLOR_RESET)"
	@go test ./...
	@echo "\n"

.PHONY: default build test watch test_js test_native build_js build_native
