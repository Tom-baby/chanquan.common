'use strict'

/**
 * The CCAP utility class which running in ipc mode on an separate VM and process
 *
 * @author lizh
 *
 */

var Q                = require('q');
var ccap             = require('ccap');

class CCAPIPC {
	constructor() {
	}
	
	static get DEFAULT_WIDTH() {
    return 163;	
	}

	static get DEFAULT_HEIGHT() {
    return 30;	
	}

	getCaptcha(plainText, options) {
		var method = '[getCaptcha]';
		options = options || {};
		options.width = options.width || CCAPIPC.DEFAULT_WIDTH;
		options.height = options.height || CCAPIPC.DEFAULT_HEIGHT;
		return Q().then(function() {
			var captcha = new ccap({
				generate: function () {
					if (plainText) {
						return plainText;
					}
					var randomStr = Math.random().toString();
					return randomStr.substr(randomStr.length - 4);
				},
				width: options.width,
				height: options.height
			});
			var ary = captcha.get();
			var verifyText = ary[0];
			var jpegContent = 'data:image/jpg;base64,' + ary[1].toString('base64');
			return {
				content: jpegContent,
				type: 'jpeg',
				encoding: 'base64'
			};
		});
	}
}

module.exports = exports = CCAPIPC;
