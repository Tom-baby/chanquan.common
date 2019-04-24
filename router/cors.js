'use strict'

/**
 * CORS Controller
 *
 * This router is following the CORS specification to turn on CORS in the service
 * The router works together with policy router
 * In opposite to CORS policy handler, the router is suited to the situation we still 
 * not preflight method defined for the API, but want to enable CORS on it.
 *
 * @author lizh
 */

var logger                = require('../services/logUtil').getLogger('chanquan:policy:cors');
/**
 * CORS controller which is used to set the cors resource rules and 
 * follow the specification to reply the rules to client who triger the request 
 * from an other domain
 */

class CORSRouter {
	constructor(policyRouter, options) {
		this._policyRouter = policyRouter;	
		this._corsCfg = options; 
		this.allowedOrigin = this._corsCfg.get('allowed-origin');
		this.allowedMethods = this._corsCfg.get('allowed-methods');
		this.allowedHeaders = this._corsCfg.get('allowed-headers');
		this.exposeHeader   = this._corsCfg.get('expose-headers');
		this.isCredentialsAllowed = this._corsCfg.get('allowed-credentials');
	}	

	static get ALLOW_ORIGIN_HEADER() {
		return 'Access-Control-Allow-Origin';
	}

	static get ALLOW_METHOD_HEADER() { 
		return 'Access-Control-Allow-Methods';
	}

	static get ALLOW_CREDENTIAL_HEADER() { 
		return 'Access-Control-Allow-Credentials';
	}

	static get ALLOW_HEADERS_HEADER() {
		return 'Access-Control-Allow-Headers';
	}

	static get EXPOSE_HEADERS_HEADER() {
		return 'Access-Control-Expose-Headers';
	}

	static get MAX_AGE() {
		return 'Access-Control-Max-Age';
	}

	static get PREFLIGHT_METHOD() {
		return 'OPTIONS';
	}

	/**
	 * Check whether it is an allowed origin
	 */
	isAllowedOrigin(origin) {
		if (! origin) return false;

		if (! this.allowedOrigin) return false;

		if (! Array.isArray(this.allowedOrigin)) {
			this.allowedOrigin = [this.allowedOrigin];
		}

		if (this.allowedOrigin.length === 0) return false;

		// normalize the origin url
		if (origin.charAt(origin.length - 1) === '/') {
			origin = origin.substr(0, origin.length - 1);
		}

		for (let i = 0; i < this.allowedOrigin.length; i++) {

			if (origin === this.allowedOrigin[i]) {
				logger.debug('Origin domain "' + origin + '" is in allowed access list');
				return true;
			}
		}
		logger.warn('Origin domain "' + origin + '" is NOT in allowed access list');
		return false;
	}

	getAllowedHeaders() {
		if (! this.allowedHeaders) return '';

		if (! Array.isArray(this.allowedHeaders)) return this.allowedHeaders;

		let headersString = '';
		for (let i = 0; i < this.allowedHeaders.length; i++) {
			headersString = headersString + this.allowedHeaders[i];

			if (i !== this.allowedHeaders.length -1) {
				headersString = headersString + ', ';
			}
		}

		logger.debug('Allowed headers: ' + headersString);
		return headersString;
	}

	getAllowedMethods() {
		if (! this.allowedMethods) return '';
		if (! Array.isArray(this.allowedMethods)) return this.allowedMethods;
		let methodString = '';
		for (let i = 0; i < this.allowedMethods.length; i++) {
			methodString = methodString + this.allowedMethods[i].toUpperCase();

			if (i !== this.allowedMethods.length -1) {
				methodString = methodString + ', ';
			}
		}

		logger.debug('Allowed HTTP request methods: ' + methodString);
		return methodString;
	}

	getExposeHeaders() {
		if (! this.exposeHeader) return '';
		if (! Array.isArray(this.exposeHeader)) return this.exposeHeader;
		let headersString = '';

		for (let i = 0; i < this.exposeHeader.length; i++) {
			headersString = headersString + this.exposeHeader[i].toUpperCase();

			if (i !== this.exposeHeader.length -1) {
				headersString = headersString + ', ';
			}
		}

		logger.debug('Expose headers: ' + headersString);
		return headersString;
	}

	getAllowedCredentials() {
		let result = 'true';

		if (! this.isCredentialsAllowed) {
			result = 'false';
		}

		logger.debug('Allow credentials: ' + result);
		return result;
	}

	preflight(req, res, next) {
		let origin = req.get('Origin');

		let remoteHost = null;
		if (req.headers['x-forwarded-host']) {
			remoteHost = req.headers['x-forwarded-host'];
		}

		if (! this.isAllowedOrigin(origin)) {
			logger.info('Skip cors processing for origin - ' + origin + ' and go to next middleware');
			return next();
		}

		logger.debug('Remote host: "' + remoteHost + '", Origin: "' + origin + '"');
		res.setHeader(CORSRouter.ALLOW_ORIGIN_HEADER, origin);
		res.setHeader(CORSRouter.ALLOW_METHOD_HEADER, this.getAllowedMethods());
		res.setHeader(CORSRouter.ALLOW_CREDENTIAL_HEADER, this.getAllowedCredentials());
		res.setHeader(CORSRouter.ALLOW_HEADERS_HEADER, this.getAllowedHeaders());
		res.setHeader(CORSRouter.EXPOSE_HEADERS_HEADER, this.getExposeHeaders());
		logger.debug('Response headers: ', res.headers);
		if(req.method === CORSRouter.PREFLIGHT_METHOD) {
			logger.debug('Preflight request with return status OK');
			return res.send(200);
		} 

		return next();
	}

	/**
	 * Initial method to initial the url and middleware handlers
	 * Sub-class should override this method to provide specific logic
	 *
	 * @override
	 */
	init() {
		let self = this;
		self._policyRouter.use('/', self.preflight.bind(self), {
			name: 'cors.preflight',
			security: {
				auth: 'NONE'
			}
		});
		return self;
	}
}

module.exports = exports = CORSRouter;
