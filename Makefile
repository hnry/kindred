COLOR = \033[1;33m
COLOR_RESET = \033[0m

default: build

build:
	@echo "transpiling chrome extension src..."
	node_modules/.bin/babel --no-comments --minified chrome/src -d chrome/ext

watch:
	@echo "auto-building chrome extension src..."
	node_modules/.bin/babel --no-comments -w chrome/src -d chrome/ext

test: test_native test_chrome

test_chrome:
	@echo "\n$(COLOR)Running Chrome tests...$(COLOR_RESET)"
	@node_modules/.bin/jasmine JASMINE_CONFIG_PATH=chrome/spec/support/jasmine.json
	@echo "\n"

test_native:
	@echo "\n$(COLOR)Running Native tests...$(COLOR_RESET)"
	@go test ./...
	@echo "\n"

.PHONY: default build test watch test_chrome test_native
