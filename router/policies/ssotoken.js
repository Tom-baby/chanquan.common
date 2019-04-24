'use strict'

/**
 * SSO-Token Authentication Policy Handler
 *
 * @author lizh
 */

let PolicyHandler         = require('../policyHandler');
let crypto                = require('crypto');
var logger                = require('../../services/logUtil').getLogger('chanquan:policy:ssotoken');

// sso cookie value encrypt key
const SSOTOKEN_ENCRYPTION_KEY = '53a52a810f7c8f1f704c96843941fea1';
const SSOTOKEN_ENCRYPTION_ALGORITHM = 'aes256';

class SSOTokenAuth extends PolicyHandler {
	constructor() {
		super();
	}

	decrypt(ssotoken) {
		let decipher = crypto.createDecipher(SSOTOKEN_ENCRYPTION_ALGORITHM, SSOTOKEN_ENCRYPTION_KEY);	

		return decipher.update(ssotoken, 'hex', 'utf8') + decipher.final('utf8');
	}

	preInvoke(context, cont) {
		let self = this;

		if (! context.bindings || ! context.bindings.security ||
			context.bindings.security.auth !== 'SSOToken') {
				logger.info('Middleware "' + context.bindings.name + '" does not enable ssotoken-auth');
				return cont();
		}

		let ssoToken = null;
		let req = context.req;
		let err = {
			errorCode: 'E_SECAUTH_0040',	
			reason: 'Unauthenticated user',
			httpStatus: 401
		};

		if (req.signedCookies && req.signedCookies.ssoToken) {
			ssoToken = self.decrypt(req.signedCookies.ssoToken);
		}

		if (! ssoToken) {
			logger.info('signedCookies.ssoToken: ', ssoToken);
			context.res.status(401).json(err);
			return cont(err);
		}

		// the decrypted token include a valid uesr/staff profile
		try {
			ssoToken = JSON.parse(ssoToken);
		} catch (error) {
			logger.error('Failed to parse ssoToen into JSON format object, due to: ', error);
		}

		if (! ssoToken || ! ssoToken._id) {
			logger.info('SSO authentication is done, give the passport to next middleware', JSON.stringify(ssoToken));
			context.res.status(401).json(err);
			return cont(err);
		} 

		return cont();
	}

	postInvoke(context, cont) {
		cont();
	}

	getName() {
		return 'SSOTokenAuth';
	}
}

module.exports = exports = SSOTokenAuth;
