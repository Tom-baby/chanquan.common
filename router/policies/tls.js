'use strict'

/**
 * TLS/SSL Restricter Policy Handler
 *
 * @author lizh
 */

let PolicyHandler         = require('../policyHandler');
var logger                = require('../../services/logUtil').getLogger('chanquan:policy:tls');

class TLSRestricter extends PolicyHandler {
	constructor() {
		super();
	}

	preInvoke(context, cont) {
		if (! context.bindings || ! context.bindings.security ||
			  ! context.bindings.security.TLSConstrained) {
			return cont();
		}

		logger.info('Middleware "' + context.bindings.name + '" is constrained to TLS/SSL protocol only');
    
		let req = context.req;

		if ('https' === req.protocol) {
			return cont();
		}

		if (req.headers && 'https' === req.headers['x-forwarded-protocol']) {
			return cont();
		}
		
		let err = {
			errorCode: 'E_SECTLS_0030',	
			reason: 'Forbidden Access',
			httpStatus: 403
		};
		context.res.status(err.httpStatus).json(err);
	  cont(err);
	}

	postInvoke(context, cont) {
		cont();
	}

	getName() {
		return 'TLSRestricter';
	}
}

module.exports = exports = TLSRestricter;
