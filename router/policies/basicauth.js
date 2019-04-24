'use strict'

/**
 * Basic Authentication Policy Handler
 *
 * @author lizh
 */

let PolicyHandler         = require('../policyHandler');
var logger                = require('../../services/logUtil').getLogger('chanquan:policy:basicauth');
let auth                  = require('basic-auth');

class BasicAuth extends PolicyHandler {
	constructor(username, password) {
		super();
		this.username = username;
		this.password = password;
	}

	preInvoke(context, cont) {
		let self = this;
		if (! context.bindings || ! context.bindings.security ||
			  context.bindings.security.auth !== 'BasicAuth') {
			logger.warn('Middleware "' + context.bindings.name + '" does not enable basic-auth');
			return cont();
		}
		
    let req = context.req;
    let credential = auth(req); 
		if (credential && self.username === credential.name && self.password  === credential.pass) {
			return cont();
		}

		let err = {
			errorCode: 'E_SECAUTH_0001',	
			reason: 'Unauthenticated user',
			httpStatus: 401
		};
		context.res.status(401).json(err);
	  cont(err);
	}

	postInvoke(context, cont) {
		cont();
	}

	getName() {
		return 'BasicAuth';
	}
}

module.exports = exports = BasicAuth;
