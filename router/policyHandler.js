'use strict'

/**
 * API Policy Handler module 
 *
 * The API Policy Handler is the basic abtract interface which used to 
 * define the policy hook
 *
 * @author lizh
 */

/**
 * HTTP Restful request lifecycle Interface
 *
 * @public
 * @interface
 *
 */

class RestfulLifecycle {
  constructor() {
	}

	/**
	 * Restful HTTP begin event
	 * @param {object} context, the context data structure is as below:
	 *   {
	 *      req: req,
	 *      res: res
	 *   }
	 *
	 * @param {function} done(error), if error is given, stop the call chain
	 * return the error immediately
	 *
	 */
	begin(context, done) {
    done();	
	}


	/**
	 * Restful HTTP end event
	 * @param {object} context, the context data structure is as below:
	 *   {
	 *      req: req,
	 *      res: res
	 *   }
	 *
	 * @param {function} done(error), if error is given, stop the call chain
	 * return the error immediately
	 *
	 */
	end(context, done) {
		done();
	}
}

/**
 * The interface to represent policy handler, 
 * will be called before/after service(express middleware) function logic
 *
 * For a concrete policy handler instance, it should be sharable, that means, it is not allowed to 
 * contains state variables
 *
 * @interface
 */
class PolicyHandler extends RestfulLifecycle {
	constructor() {
		super();
	}

	/**
	 * The method will be called before go into service middleware function
	 * 
	 * @param {object} context, the context data structure is as below:
	 *   {
	 *      req: req,
	 *      res: res,
	 *      targetFn: <function>,
	 *      bindings:<object>
	 *   }
	 * @param {function} continue , continue(error), if error is given, means
	 * stop the pipleline execution and return to caller immediately
	 *
	 */
	preInvoke(context, cont) {
		cont();
	}

	/**
	 * The method will be called after the middleware function processed
	 * 
	 * @param {object} context, the context data structure is as below:
	 *   {
	 *      req: req,
	 *      res: res,
	 *      targetFn: <function>,
	 *      bindings:<object>
	 *   }
	 * @param {function} continue , continue(error), if error is given, means
	 * stop the pipleline execution and return to caller immediately
	 *
	 */
	postInvoke(context, cont) {
		cont();
	}

	/**
	 * Get policy handler name
	 * @return {string} name
	 *
	 * @abstract
	 */
	getName() {
		throw new Error('Abstract method can not be called');
	}
}

module.exports = exports = PolicyHandler;
