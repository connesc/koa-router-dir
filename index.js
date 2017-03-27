'use strict';

const Router = require('koa-router');
const requireAll = require('require-all');

module.exports = exports = (rootPath) => {
	const router = new Router();
	for (const value of load(router, rootPath)) { // eslint-disable-line no-unused-vars
		// Ignore exported values
	}
	return router;
};

exports.async = async (rootPath) => {
	const router = new Router();
	for (const value of load(router, rootPath)) {
		await value;
	}
	return router;
};

function load(router, rootPath) {
	return loadRoutes(router, [], requireAll(rootPath));
}

function* loadRoutes(parentRouter, path, routes) {
	if (typeof routes === 'function') {
		const router = getRouter();

		// Call the user-defined initialization function
		yield routes(router);

		mount(router);

	} else if (routes instanceof Object) {
		const keys = Object.keys(routes);

		if (keys.length === 1) {
			// Forward the route definition to the unique child
			const key = keys[0];
			const childPath = (key === 'index') ? path : path.concat([key]);
			yield* loadRoutes(parentRouter, childPath, routes[key]);

		} else if (keys.length > 1) {
			const subRouter = getRouter();

			// Always start by the index, if any
			if (routes.hasOwnProperty('index')) {
				yield* loadRoutes(subRouter, [], routes.index);
			}

			// Then, load the other routes
			for (const key of keys) {
				if (key !== 'index') {
					yield* loadRoutes(subRouter, [key], routes[key]);
				}
			}

			mount(subRouter);
		}
	}

	function getRouter() {
		// Create a sub-router if a mount path is defined (otherwise, use the
		// parent router directly)
		return (path.length > 0) ? new Router() : parentRouter;
	}

	function mount(router) {
		// Mount the sub-router to its parent
		if (path.length > 0) {
			parentRouter.use('/' + path.join('/'), router.routes(), router.allowedMethods());
		}
	}
}
