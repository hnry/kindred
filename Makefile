COLOR = \033[1;33m
COLOR_RESET = \033[0m

default: build

build: build_js build_native

build_native:
	cd native; go build; cd ..

build_js:
	@echo "transpiling chrome extension src..."
	node_modules/.bin/babel --no-comments --minified chrome/src -d chrome/ext
	cp node_modules/jquery/dist/jquery.min.js chrome/ext/jquery.js
	cp node_modules/react/dist/react.min.js chrome/ext/react.js
	cp node_modules/react-dom/dist/react-dom.min.js chrome/ext/react-dom.js

watch:
	@echo "auto-building chrome extension src..."
	node_modules/.bin/babel --no-comments -w chrome/src -d chrome/ext

test: test_js test_ui test_native

test_js:
	@echo "\n$(COLOR)Running Chrome tests...$(COLOR_RESET)"
	@node_modules/.bin/jasmine JASMINE_CONFIG_PATH=chrome/spec/support/extension.json
	@echo "\n"

test_native:
	@echo "\n$(COLOR)Running Native tests...$(COLOR_RESET)"
	@go test -race ./...
	@echo "\n"

test_ui:
	@echo "\n$(COLOR)Running Chrome UI tests...$(COLOR_RESET)"
	@node_modules/.bin/jasmine JASMINE_CONFIG_PATH=chrome/spec/support/ui.json
	@echo "\n"

.PHONY: default build test watch test_js test_ui test_native build_js build_native
