default: build

build:
	@echo "transpiling chrome extension src..."
	node_modules/.bin/babel --no-comments --minified chrome/src -d chrome/ext

watch:
	@echo "auto-building chrome extension src..."
	node_modules/.bin/babel --no-comments -w chrome/src -d chrome/ext

test:
	@echo "test"

.PHONY: default build test watch
