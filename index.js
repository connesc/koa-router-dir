'use strict';

const KoaRouter = require('koa-router');
const requireAll = require('require-all');

module.exports = exports = (rootPath) => load(rootPath, null);

exports.async = async (rootPath) => {
	const promises = [];
	const router = load(rootPath, promises);
	await Promise.all(promises);
	return router;
};

function load(rootPath, promises) {
	const router = new KoaRouter();
	loadRoutes(router, [], requireAll(rootPath), promises);
	return router;
}

function loadRoutes(parentRouter, path, routes, promises) {
	if (typeof routes === 'function') {
		const router = getRouter();

		// Call the user-defined initialization function
		const promise = routes(router);
		if (promises) {
			promises.push(promise);
		}

		mount(router);

	} else if (routes instanceof Object) {
		const keys = Object.keys(routes);

		if (keys.length === 1) {
			// Forward the route definition to the unique child
			const key = keys[0];
			const childPath = (key === 'index') ? path : path.concat([key]);
			loadRoutes(parentRouter, childPath, routes[key], promises);

		} else if (keys.length > 1) {
			const subRouter = getRouter();

			// Always start by the index, if any
			if (routes.hasOwnProperty('index')) {
				loadRoutes(subRouter, [], routes.index, promises);
			}

			// Then, load the other routes
			for (const key of keys) {
				if (key !== 'index') {
					loadRoutes(subRouter, [key], routes[key], promises);
				}
			}

			mount(subRouter);
		}
	}

	function getRouter() {
		// Create a sub-router if a mount path is defined (otherwise, use the
		// parent router directly)
		return (path.length > 0) ? new KoaRouter() : parentRouter;
	}

	function mount(router) {
		// Mount the sub-router to its parent
		if (path.length > 0) {
			parentRouter.use('/' + path.join('/'), router.routes(), router.allowedMethods());
		}
	}
}
