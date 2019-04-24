'use strict'

/**
 * This is a simple logger to track the service entry/exit time via service hook
 * The logic in class is quite simple, it also works as a demonstration of how to
 * develop a service Hook
 *
 * @author lizh
 */

let PolicyHandler     = require('../policyHandler');
var logger　　　　　　　= require('../../services/logUtil').getLogger('chanquan:policy:simplelogger');

class SimpleLogger extends PolicyHandler {
	constructor() {
		super();
	}

	preInvoke(context, cont) {
		let now = new Date();

		let protocol = context.req.protocol;
		if (context.req.headers && context.req.headers['x-forwarded-protocol']) {
			protocol = context.req.headers['x-forwarded-protocol'];
		}
		
		logger.info('[Entry] resource-path: <'
								+ context.req.originalUrl
								+ '>; protocol: <'
								+ protocol 
								+ '>; method: <'
								+ context.req.method
								+ '>; sessionId: <'
								+ ((context.req.session) ? context.req.session.id : '-')
								+ '>; middleware-fn: <'
								+ context.bindings.name
								+ '> @' + now.toISOString());
	  cont();
	}

	postInvoke(context, cont) {
		let now = new Date();
		let protocol = context.req.protocol;
		if (context.req.headers && context.req.headers['x-forwarded-protocol']) {
			protocol = context.req.headers['x-forwarded-protocol'];
		}
		logger.info('[Exit] resource-path: <'
								+ context.req.originalUrl
								+ '>; protocol: <'
								+ protocol 
								+ '>; method: <'
								+ context.req.method
								+ '>; statusCode: <'
								+ ((context.res.statusCode) ? context.res.statusCode : '-')
								+ '>; sessionId: <'
								+ ((context.req.session) ? context.req.session.id : '-')
								+ '>; middleware-fn: <'
								+ context.bindings.name
								+ '> @' + now.toISOString());
		cont();
	}

	getName() {
		return 'SimpleLogger';
	}
}

module.exports = exports = SimpleLogger;
