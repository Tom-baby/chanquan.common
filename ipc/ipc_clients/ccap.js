'use strict'

/**
 * The CCAP utility class which running in ipc client side within main VM content in master process 
 *
 * @author lizh
 *
 */

let Q                = require('q');
let Stub             = require('../stub');

class CCAPClient extends Stub {
	constructor() {
		super('ccap');
	}

	static get DEFAULT_WIDTH() {
    return 163;	
	}
	
	static get DEFAULT_HEIGHT() {
    return 30;	
	}

	/**
	 * CCAP IPC client API for get captcha
	 * @param {string}, plain text for the content for picturify
	 * @parm {object}, options, includes: options.width, the width of picture
	 * @param {function}, callback, optional parameter for callback sytle invocation
	 *
	 * @return {promise}, value of the API in promise style
	 */
	getCaptcha(plainText, options, callback) {
		let self = this;
		let method = '[getCaptcha]';
		
		if (options && 'function' === typeof options) {
			callback = options;
			options = null;
		}
		
		options = options || {};
		if (! options.width) {
			options.width = CCAPClient.DEFAULT_WIDTH;  
		}
		
		if (! options.height) {
			options.height = CCAPClient.DEFAULT_HEIGHT;  
		}

		let deferred = Q.defer();
		self._invoke('getCaptcha', [plainText, options], function(error, result) {
			if (error) {
				return deferred.reject(error);	
			} 

			if ('string' === typeof result) {
				try {
					result = JSON.parse(result);	
				} catch(err) {
					return deferred.reject(err);
				}	
			}

			deferred.resolve(result);
		});
		return deferred.promise.nodeify(callback);
	}
}

module.exports = exports = CCAPClient;

//=================================
//           Test
//=================================

//  let ccap = new CCAPClient();
//  
//  ccap.getCaptcha('9876', function(error, result) {
//    console.log('result: ', result);
//  });
