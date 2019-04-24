'use strict'

/**
 * CORS Policy Handler, which be used in the situation of we already 
 * have the required http router for all methods, just turn on CORS
 *
 * @author lizh
 */

var logger                = require('../../services/logUtil').getLogger('chanquan:route:cors');
let PolicyHandler         = require('../policyHandler');

/**
 * CORS controller which is used to set the cors resource rules and 
 * follow the specification to reply the rules to client who triger the request 
 * from an other domain
 */

class CORSPolicyHandler extends PolicyHandler {
	constructor(options) {
		super();
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
				logger.info('Origin domain "' + origin + '" is in allowed access list');
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

		logger.info('Allow credentials: ' + result);
		return result;
	}

	preInvoke(context, cont) {
		let self = this;
		if (! context.bindings || ! context.bindings.CORSEnabled) {
			logger.warn('Middleware "' + context.bindings.name + '" does not enable CORS');
			return cont();
		}

		let req = context.req;
		let res = context .res;
		let origin = req.get('Origin');
		let remoteHost = null;
		if (req.headers['x-forwarded-host']) {
			remoteHost = req.headers['x-forwarded-host'];
		}
		if (! self.isAllowedOrigin(origin)) {
			logger.warn('Origin - ' + origin + ' does not turn on CORS');
			return cont();
		}

		logger.debug('Remote host: "' + remoteHost + '", Origin: "' + origin + '"');
		res.setHeader(CORSRouter.ALLOW_ORIGIN_HEADER, origin);
		res.setHeader(CORSRouter.ALLOW_METHOD_HEADER, self.getAllowedMethods());
		res.setHeader(CORSRouter.ALLOW_CREDENTIAL_HEADER, self.getAllowedCredentials());
		res.setHeader(CORSRouter.ALLOW_HEADERS_HEADER, self.getAllowedHeaders());
		res.setHeader(CORSRouter.EXPOSE_HEADERS_HEADER, self.getExposeHeaders());
		logger.debug('Response headers: ', res.headers);

		if(req.method === CORSRouter.PREFLIGHT_METHOD) {
			logger.info('CORS preflight request is returned with status OK');
			res.send(200);
			return cont(false);
		} 

		return cont();
	}

	postInvoke(context, cont) {
		cont();
	}

	getName() {
    return 'CORSPolicyHandler';	
	}
}

module.exports = exports = CORSPolicyHandler;
