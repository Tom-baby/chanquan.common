'use strict'

/**
 * Dyanmical invocation stub class which is used 
 * to proxy the invocation from ipc client to the target module 
 * which running in a sandbox VM environment in a separate process
 *
 * @author lizh
 */

var logger                = require('../services/logUtil').getLogger('chanquan:ipc:stub');
let	Sandbox 					= require("./sandbox");

let timeout = 2*60*1000;

/**
 * Reply callback handlers which is used for pass the message, result back from separate ipc process/VM.
 */
class Handler {
   constructor(callback, moduleName) {
		 let self = this;
		 self._callback = callback;
		 self._moduleName = moduleName;
		 self['console.log'] = function (msg) {
			 logger.debug('['+self._moduleName+'] [console]: ', msg);
		 };

		 self['print'] = function (msg) {
			 logger.debug('['+self._moduleName+'] [print]: ', msg);
		 };

		 self['timeout'] = function (msg) {
			 logger.error('['+self._moduleName+'] [timeout]: ', msg);
			 self._callback(new Error('Timout Exception', msg));
		 };

		 self['exception'] = function (msg) {
			 logger.error('['+self._moduleName+'] [exception]: ', msg);
			 self._callback(new Error(msg));
		 };

		 self['result'] = function (msg) {
			 self._callback(null, msg);
		 };

		 self['exit'] = function (msg) {
			 logger.debug('['+self._moduleName+'] [exit]: ', msg);
		 };
	 }
}

/***
 * The Stub class which responsible for calling to the customized module hosted in
 * a sandbox environment.
 * The customized module for adapter mapping should contains the method signatures,
 * the caller to this stub does not need to the details of how to make a sandbox call,
 * just regard it as a local module call.
 */
class Stub {
   constructor(moduleName) {
		 if (! moduleName) {
			 throw new Error('Invalid moudle name - ' + moduleName);
		 }
		 let self = this;
		 self.moduleName = moduleName;
		 self.sandbox = new Sandbox({ timeout: timeout, require: [{module: "./ipc_modules/" + this.moduleName, options: {} }] });
	 }

	 /**
	  * The main method in script snippet which aimed to call into module methods in
	  * the child process. This snippet will be called within VM in the child process,
	  * can't be called within server process directly.
	  * 
		* The method will detect whether module define the callback parameter, if it defined,
		* we will assume the module is running in the callback, otherwise, we will assume a promise
		* or the real result will be returned by the module calls.
		*  
		* @param {object} targetModule 
		* @param {string} method
		* @param [object] args
		* 
		* @returns {promise}, result
		*
		* @private
		*
		*/
	 static mainJS(targetModule, method, args) {
		 if (! targetModule) {
			 return Q.reject('Invalid parameter value ipc module - [' + targetModule + ']!');
		 }
		 if (! method) {
			 return Q.reject('Invalid parameter value verb - [' + method + ']!');
		 }
		 if ('function' !== typeof targetModule[method]) {
			 return Q.reject('Target module does not have function' +  '- [' + method + ']!');
		 }

		 let result = targetModule[method].apply(targetModule, args);
		 if (Q.isPromise(result)) {
			 // console.log('Result type is Promise in mainJS for the invocation to method "' + method + '"');
			 return result;
		 }
		 // sync call return result directly
		 // console.log('The method' + method + ' is sync operations as it neither defines callback nor promise returned');
		 return Q(result);
	 }
   
	 /**
		* JS Launcher Generation method
		* Static helper method to generate a JS code for launching and invoking target ipc module and method
		*
		* @param {string}, module name
		* @param {string}, method name
		* @param [object], arguments
		*
		* @private
		* @final
		*/
	 static JSLauncherGen(moduleName, method, args) {
		 let argsDeclaration = 'let args = JSON.parse(' + '\'' + JSON.stringify(args) + '\'' + ');\n'
		 let targetModuleDeclaration = 'let targetModule = ' + moduleName+ ';\n'
		 let mainJSFunSrc = Stub.mainJS.toString();
		 mainJSFunSrc = mainJSFunSrc.replace('mainJS', 'function');
		 let mainMethodDeclaration = "(" + mainJSFunSrc + ")" + '(targetModule, \''+ method +'\', args);\n';
		 return  argsDeclaration + targetModuleDeclaration + mainMethodDeclaration;
	 } 

	 /**
		* Dynamic invoke method which delegate the invocation to the sandbox
		* and the sandbox by turn call to the target module in separate process
		*
		* @protected
		*/
	 _invoke(method, args, callback) {
		 let self = this;
		 let jsSnippet = Stub.JSLauncherGen(self.moduleName, method, args);
		 let handlers = new Handler(callback, self.moduleName);
		 self.sandbox.run(jsSnippet, handlers);
	 }
}

module.exports = Stub;

//=====================================
//          Test
//=====================================

// let stub = new Stub('ccap');
// stub._invoke('getCaptcha', ['1234', 164], function(error, result) {
//    console.log('result: ', result);
// });

