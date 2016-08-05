all :: omap5.js

%.js: %.coffee
	coffee --compile --bare $<
