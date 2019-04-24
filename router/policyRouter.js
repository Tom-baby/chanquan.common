'use strict'

/**
 * Policy Router Module 
 *
 * The API Policy Router Module provides policy based API endpoint management. It improve the express router API with extensible policy 
 * hook points(pre and post invocation), which can be used to track the API behavior, e.g: including adding API logger, API metrics, rate limiting,
 * and API analytics, also including the API endpoint protection for transport protocol validation as well as instance based dynamical authorization.
 *
 * @author lizh
 */

var logger               = require('../services/logUtil').getLogger('chanquan:policyrouter');
let Q                    = require('q');

/**
 * Internal class which is used to register/unregister a 
 * Policy hanlder
 *
 * @class
 * @private
 */
class PolicyHandlerRegistry {
	constructor() {
		this.pipeline = [];
	}

	/**
	 * Add a new policy handler into execution pipeline
	 *
	 */
	add(handler) {
		this.pipeline.push(handler);
		logger.debug('Policy handler "' + handler.getName() + '" is registered');
	}

	/**
	 * Remove a policy handler from execution pipeline
	 */
	remove(name) {

		if (! name) return;

		for (let i = this.pipeline.length; i >= 0; i--) {
			if (name === this.pipeline[i].getName()) {
				logger.debug('Policy handler "' + name  + '" is unregistered');
				this.pipeline.splice(i, 1);
			}
		}
	}

  /**
	 * Return execution pipeline
	 */
	getPipeline() {
		return this.pipeline;
	}
}

/**
 * The PreHookChain Invoker
 *
 * @class
 * @private
 */
class PreHookChainInvoker {
	constructor(context, handlerRegistry) {
		this.context = context;
		this.cursor = 0;
		this.handlerRegistry = handlerRegistry;
		this.beginCursor = 0;
		this.beginCtx = {req: context.req, res: context.res};
	}
 
	/**
	 * The Restful request begin entry
	 * This method will be called only once per HTTP request
	 */
	begin() {
		if (this.handlerRegistry.getPipeline().length === 0) {
			return Q();
		}

		this.beginDeferred = Q.defer();
		this.handlerRegistry.getPipeline()[this.beginCursor].begin(this.beginCtx, this._done.bind(this));
		return this.beginDeferred.promise;
	}


	_done(errorOrStopCont) {
    if (errorOrStopCont === false) {
			return this.beginDeferred.resolve();
		}
		if (errorOrStopCont && true !== errorOrStopCont) {
			return this.beginDeferred.reject(errorOrStopCont);
		}

		this.beginCursor++;
		if (this.beginCursor === this.handlerRegistry.getPipeline().length) {
			return this.beginDeferred.resolve();
		}
		this.handlerRegistry.getPipeline()[this.beginCursor].begin(this.beginCtx, this._done.bind(this));
	}

	/**
	 * Call the pre invoke hooks chain
	 * This method will be called per middleware, e.g: if middleware-1 call next method 
	 * and hand over to middleware-2, the invoke method should be called per middleware
	 *
	 * @return {promise} promise<boolean>,      
	 *                   true means go forward to call to real target, 
	 *                   false means hook stop the execution to real target
	 */
	invoke() {
		if (this.handlerRegistry.getPipeline().length === 0) {
			return Q();
		}

		this.deferred = Q.defer();
		this.handlerRegistry.getPipeline()[this.cursor].preInvoke(this.context, this._continue.bind(this));
		return this.deferred.promise;
	}

	/**
	 * Call the pre invoke hooks chain
	 *
	 * @return {promise} promise<boolean>,      
	 *     true means go forward to call to real target, 
	 *     false means hook stop the execution to real target
	 * @private
	 */
	_continue(errorOrStopCont) {
		if (errorOrStopCont === false) {
			return this.deferred.resolve();
		}
		if (errorOrStopCont && true !== errorOrStopCont) {
			return this.deferred.reject(errorOrStopCont);
		}

		this.cursor++;
		if (this.cursor === this.handlerRegistry.getPipeline().length) {
			return this.deferred.resolve();
		}
		this.handlerRegistry.getPipeline()[this.cursor].preInvoke(this.context, this._continue.bind(this));
	}

}

/**
 * The PreHookChain Invoker
 *
 * @class
 * @private
 */
class PostHookChainInvoker {
	constructor(context, handlerRegistry) {
		this.context = context;
		this.handlerRegistry = handlerRegistry;
		this.cursor = handlerRegistry.getPipeline().length - 1;
		this.endCursor = handlerRegistry.getPipeline().length - 1;
		this.endCtx = {req: context.req, res: context.res};
	}

	/**
	 * The Restful request begin entry
	 * This method will be called only once per HTTP request
	 */
	end() {
		if (this.handlerRegistry.getPipeline().length === 0) {
			return Q();
		}
		this.endDeferred = Q.defer();
		this.handlerRegistry.getPipeline()[this.endCursor].end(this.endCtx, this._done.bind(this));
		return this.endDeferred.promise;
	}
	
	_done(errorOrStopCont) {
		if (errorOrStopCont === false) {
			return this.endDeferred.resolve();
		}
		if (errorOrStopCont && true !== errorOrStopCont) {
			return this.endDeferred.reject(errorOrStopCont);
		}

		this.endCursor--;
		if (this.endCursor === -1) {
			return this.endDeferred.resolve();
		}
		this.handlerRegistry.getPipeline()[this.endCursor].end(this.endCtx, this._done.bind(this));
	};
	
	/**
	 * Call the post invoke hooks chain
	 *
	 * @return {promise} promise,      
	 *      true means go forward to call to real target, 
	 *      false means hook stop the execution to real target
	 */
	invoke() {
		if (this.handlerRegistry.getPipeline().length === 0) {
			return Q();
		}
		this.deferred = Q.defer();
		this.handlerRegistry.getPipeline()[this.cursor].postInvoke(this.context, this._continue.bind(this));
		return this.deferred.promise;
	}

	_continue(errorOrStopCont) {
		if (errorOrStopCont === false) {
			return this.deferred.resolve();
		}
		if (errorOrStopCont && true !== errorOrStopCont) {
			return this.deferred.reject(errorOrStopCont);
		}

		this.cursor--;
		if (this.cursor === -1) {
			return this.deferred.resolve();
		}
		this.handlerRegistry.getPipeline()[this.cursor].postInvoke(this.context, this._continue.bind(this));
	};
}

/**
 * The stack trace captuer
 *
 * @private 
 * @function
 */
let getStackTrace = function() {
  let obj = {};
  Error.captureStackTrace(obj, getStackTrace);
  return obj.stack;
};

/**
 * The proxy middleware class used to do AOP things (before/after) on the request/response getting into/out 
 * of express middleware
 *
 * @param {function} deleteHandler, optional parameter for request path, mandatory parameter in 
 * response path
 * @param {object} options, the options include below properties:
 * {
 *		name: <string>, // middleware name
 * 		role: [<string>] // permission role	
 * 		...
 * }
 *	if we want to specify a the target middleware handler to be delegated
 *
 * @class
 * @private
 */
class MiddleWareProxy {
	constructor(delegateHandler, bindings, handlerRegistry) {
		this.delegateHandler = delegateHandler;
		this.bindings = bindings;
		this.handlerRegistry = handlerRegistry;
	}

	/**
		* The wrapper express middleware handler, which will do something in post-handler phase
		*/
	invoke(req, res, next) {
		let self = this;

		if (! res.resEnder) {
			let ender = new ResponseEnder(req, res, self.bindings, self.handlerRegistry);
			res.end.bind(res);
			res.end = ender.end.bind(ender);
			res.resEnder = ender;
		} else {
			res.resEnder.setPolicyBindings(self.bindings);
			logger.debug('The res.end has been wrapped, no need to wrap it!');
		}

		let nexter = new Nexter(req, res, next, self.bindings, self.handlerRegistry);
		let context = {
			req: req,
			res: res,
			next: nexter.next.bind(nexter),
			targetFn: self.delegateHandler,
			bindings: self.bindings
		}

		let preHookChainInvoker = new PreHookChainInvoker(context, self.handlerRegistry);

		let beginPromise = Q();
		if (! res._policy_router_begin_done) {
			beginPromise = preHookChainInvoker.begin();	
		}
		beginPromise.then(function() {
			res._policy_router_begin_done = true;	
			return preHookChainInvoker.invoke().then(function() {
				return self.delegateHandler(req, res, nexter.next.bind(nexter));
			});
		}).fail(function(error) {
			logger.error('Error occurs during go through pre-hook chain, the reason is: ', error);
		});
	}
}

/**
 * Express middleware "next" function wrapper
 *
 * @private
 * @class
 */
class Nexter {
	constructor(req, res, nexter, bindings, handlerRegistry) {
		this.req = req;
		this.res = res;
		this.origNexter = nexter;
		this.bindings = bindings;
		this.handlerRegistry = handlerRegistry;
	}

	next() {
		let self = this;

		let context = {
			req: self.req,
			res: self.res,
			bindings: self.bindings
		}

		let postHookChainInvoker = new PostHookChainInvoker(context, self.handlerRegistry);
		postHookChainInvoker.invoke().then(function() {
			return self.origNexter();	
		}).fail(function(error) {
			logger.error('Error occurs during go through post-hook chain, the reason is: ', error);
		});
	}
}

/**
 * Express middleware "end" function wrapper
 *
 * @private
 */
class ResponseEnder {
	constructor(req, res, bindings, handlerRegistry) {
		this.req = req;
		this.res = res;
		this.origEnder = res.end.bind(res);
		this.bindings = bindings;
		this.handlerRegistry = handlerRegistry;
	}

	setPolicyBindings(bindings) {
		this.bindings = bindings;
	}

	/**
		* Wrapper end method, will execute the original end logic and then get into hook handlers logic
		*/
	end(data, encoding) {
		// console.log(getStackTrace());
		let fault = null;
		try {
			this.origEnder(data, encoding);
		} catch (error) {
			logger.error('Error: ', error);
			fault = error;
		}

		let self = this;
		let context = {
			req: self.req,
			res: self.res,
			bindings: self.bindings
		}
		let postHookChainInvoker = new PostHookChainInvoker(context, self.handlerRegistry);
		postHookChainInvoker.invoke().then(function() {
			delete self.res.resEnder;
		}).then(function() {
			delete self.res._policy_router_begin_done;
			return postHookChainInvoker.end(); 
		}).fail(function(err) {
			logger.error('Error occurs during go through post-hook chain, the reason is: ', err);
		});

		if (fault) throw fault;
	}
}

/**
 * PolicyRouterFacade class
 */
let PolicyRouterFacade = (function() {

  //================================	 
	//  Private letiables defintions
	//================================
	
	/**
	 * Express original router
	 * @private
	 */
	let _origRouter = null;

	/**
	 * Policy handlers
	 * @private
	 */
	let _handlerRegistry = new PolicyHandlerRegistry(); 

	/**
	 * API endpoints
	 * {
	 *   name: string,  // API qualified name
	 *   path: string,  // Rest API path expression
	 *   method: string // HTTP method(verb)
	 * }
	 * @private
	 */
	let _apiEndpoints = [];

	/**
	 * The class for data source registry
	 *
	 * @public
	 */
	class PolicyRouter {
		constructor(router) {
			_origRouter = router;
		}

    /**
		 * Register a new policy handler 
		 *
		 * @param {string}, datasource name
		 *
		 * @return {Object}, datasource instance
		 */
		register(handler) {
	    return _handlerRegistry.add(handler);;
		}
    
		/**
		 * Unregister a policy handler 
		 *
		 * @param {string}, datasource name
		 *
		 * @return {Object}, datasource instance
		 */
		unregister(name) {
	    return _handlerRegistry.remove(name);;
		}

		/**
		 * ReadOnly method to get endpoints registered by
		 * this policy router
		 *
		 * @return [endpoint], Array of endpoints
		 */
		getEndpoints() {
	    return JSON.parse(JSON.stringify(_apiEndpoints));	
		}

		/**
		 * Express router.get method
		 *
		 * @override
		 */
		get(path, middleware, bindings) {
			
			if (! path || 'string' !== typeof path) {
         throw new Error('Invalid parameter "' + path + '": "' + path + '"');
			} 
			
			if (! middleware || 'function' !== typeof middleware) {
         throw new Error('Invalid parameter "' + middlwware+ '"');
			}

			let mwproxy = new MiddleWareProxy(middleware, bindings, _handlerRegistry);
      _origRouter.get(path, mwproxy.invoke.bind(mwproxy));

			_apiEndpoints.push({
				name: (bindings) ? bindings.name : null,
				path: path,
				method: 'GET'
			});
		}

		/**
		 * Express router.get method
		 *
		 * @override
		 */
		put(path, middleware, bindings) {
			if (! path || 'string' !== typeof path) {
         throw new Error('Invalid parameter "' + path + '": "' + path + '"');
			} 
			
			if (! middleware || 'function' !== typeof middleware) {
         throw new Error('Invalid parameter "' + middlwware+ '"');
			}

			let mwproxy = new MiddleWareProxy(middleware, bindings, _handlerRegistry);
      _origRouter.put(path, mwproxy.invoke.bind(mwproxy));

			_apiEndpoints.push({
				name: (bindings) ? bindings.name : null,
				path: path,
				method: 'PUT'
			});
		}

		/**
		 * Express router.get method
		 *
		 * @override
		 */
		delete(path, middleware, bindings) {
			if (! path || 'string' !== typeof path) {
         throw new Error('Invalid parameter "' + path + '": "' + path + '"');
			} 
			
			if (! middleware || 'function' !== typeof middleware) {
         throw new Error('Invalid parameter "' + middlwware+ '"');
			}

			let mwproxy = new MiddleWareProxy(middleware, bindings, _handlerRegistry);
      _origRouter.delete(path, mwproxy.invoke.bind(mwproxy));

			_apiEndpoints.push({
				name: (bindings) ? bindings.name : null,
				path: path,
				method: 'DELETE'
			});
		}

		/**
		 * Express router.get method
		 *
		 * @override
		 */
		post(path, middleware, bindings) {
			if (! path || 'string' !== typeof path) {
         throw new Error('Invalid parameter "' + path + '": "' + path + '"');
			} 
			
			if (! middleware || 'function' !== typeof middleware) {
         throw new Error('Invalid parameter "' + middlwware+ '"');
			}

			let mwproxy = new MiddleWareProxy(middleware, bindings, _handlerRegistry);
      _origRouter.post(path, mwproxy.invoke.bind(mwproxy));

			_apiEndpoints.push({
				name: (bindings) ? bindings.name : null,
				path: path,
				method: 'POST'
			});
		}

		/**
		 * Express router.get method
		 *
		 * @override
		 */
		options(path, middleware, bindings) {
			if (! path || 'string' !== typeof path) {
         throw new Error('Invalid parameter "' + path + '": "' + path + '"');
			} 
			
			if (! middleware || 'function' !== typeof middleware) {
         throw new Error('Invalid parameter "' + middlwware+ '"');
			}

			let mwproxy = new MiddleWareProxy(middleware, bindings, _handlerRegistry);
      _origRouter.options(path, mwproxy.invoke.bind(mwproxy));

			_apiEndpoints.push({
				name: (bindings) ? bindings.name : null,
				path: path,
				method: 'OPTIONS'
			});
		}

		/**
		 * Express router.get method
		 *
		 * @override
		 */
		patch(path, middleware, bindings) {
			if (! path || 'string' !== typeof path) {
         throw new Error('Invalid parameter "' + path + '": "' + path + '"');
			} 
			
			if (! middleware || 'function' !== typeof middleware) {
         throw new Error('Invalid parameter "' + middlwware+ '"');
			}

			let mwproxy = new MiddleWareProxy(middleware, bindings, _handlerRegistry);
      _origRouter.patch(path, mwproxy.invoke.bind(mwproxy));

			_apiEndpoints.push({
				name: (bindings) ? bindings.name : null,
				path: path,
				method: 'PATCH'
			});
		}
		
		/**
		 * Express router.get method
		 *
		 * @override
		 */
		search(path, middleware, bindings) {
			if (! path || 'string' !== typeof path) {
         throw new Error('Invalid parameter "' + path + '": "' + path + '"');
			} 
			
			if (! middleware || 'function' !== typeof middleware) {
         throw new Error('Invalid parameter "' + middlwware+ '"');
			}

			let mwproxy = new MiddleWareProxy(middleware, bindings, _handlerRegistry);
      _origRouter.search(path, mwproxy.invoke.bind(mwproxy));

			_apiEndpoints.push({
				name: (bindings) ? bindings.name : null,
				path: path,
				method: 'SEARCH'
			});
		}

		/**
		 * Express router.get method
		 *
		 * @override
		 */
		use(path, middleware, bindings) {
			if (! path || 'string' !== typeof path) {
         throw new Error('Invalid parameter "' + path + '": "' + path + '"');
			} 
			
			if (! middleware || 'function' !== typeof middleware) {
         throw new Error('Invalid parameter "' + middlwware+ '"');
			}

			let mwproxy = new MiddleWareProxy(middleware, bindings, _handlerRegistry);
      _origRouter.use(path, mwproxy.invoke.bind(mwproxy));

			_apiEndpoints.push({
				name: (bindings) ? bindings.name : null,
				path: path,
				method: 'ALL'
			});
		}

		/**
		 * Express router.all method
		 *
		 * @override
		 */
		all(path, middleware, bindings) {
	    throw new Error('Unsupport method');	
		}
		
		/**
		 * Express router.get method
		 *
		 * @override
		 */
		param(name, middleware, bindings) {
	    throw new Error('Unsupport method');	
		}

		/**
		 * Express router.get method
		 *
		 * @override
		 */
		route(path, middleware, bindings) {
	    throw new Error('Unsupport method');	
		}
	}
	return PolicyRouter;
})();

module.exports = exports = PolicyRouterFacade; 
