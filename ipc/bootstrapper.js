/**
 * Dyanmical invocation bootstrapper class which is used 
 * to bootstrap the js code snippet which passed from ipc client to the target module 
 * which running in a sandbox VM environment in a separate process
 *
 * @author lizh
 */

var Q                      = require('q');
var stdin                  = process.openStdin();
var Script                 = require( 'vm' );

var blocked = ['fs', 'process', 'child_process', 'vm', 'os' ];  // modules that are blocked
var _moduleCache = {};

function moduleCache(m) {
	var module = m.replace(/.*\//,"");
	this.module = module;
}

moduleCache.prototype.getCache = function () {
	return Q(_moduleCache[this.module]);
};

moduleCache.prototype.saveCache = function (cache) {
	_moduleCache[this.module] = cache;
	var msg = {
		message: {
			"cache.save" : {
				module: this.module,
				cache: cache
			}
		}
	};
	var txt = _safeStringify(msg) + ',';
	return Q.nfapply(process.stdout.write.bind(process.stdout), [txt])
		.then (function() {
			return cache;
		});
};

function _safeStringify(obj) {
	var visited = [];
	return JSON.stringify(obj, function(key, value){
		if (value === undefined || typeof value === 'function')
			return undefined;
		if (typeof value === 'object') { 
			if (visited.indexOf(value) !== -1) 
				return undefined;
			visited.push(value);
		}
		return value;
	});	
}

var _chunk = "";
stdin.on('data', function(data) {
	_chunk += data;
	var request;
	try {
		request = JSON.parse(_chunk);
		if (request.cache)
			for (var p in request.cache) {
				_moduleCache[p] = request.cache[p];
			}
		if (request.script)
			run(request.script, request.require, request.global, request.introspect);
	} catch (err) {
		process.stdout.write(_safeStringify({
			message: {
				'console.log': "Received input chunk from runtime, waiting for more...."
			}
		}) + ',');
	}

});

var _require = function (module) {
	blocked.forEach (function (b){
		if (b === module)
			throw new Error ("Module Blocked: "+module);
	});
	if (module.indexOf("..")>=0)
		throw new Error ("Module Blocked: "+module);
	return require (module);
};

function exit() {
	process.exit(0);
}

function run(script, req, global, introspect) {	
	try {
		var context = Script.createContext();
		var transmit = function(message, callback) {
			"use strict";
			return process.stdout.write(_safeStringify({
				message : message
			}) + ',', callback);
		};

		var recurseIntrospect = function(target, returnVal) {
			if (typeof target === 'object' && !(target instanceof Array)) {
				for ( var prop in target) {
					returnVal[prop] = {};
					recurseIntrospect(target[prop], returnVal[prop]);
				}
			}
		};

		var introspector = function(modules) {
			var results = {};
			for ( var moduleName in modules) {
				try {
					var module = modules[moduleName];
					results[moduleName] = {};
					if (typeof module === 'function') {
						// see if no args constructor, needs to stay in synch with bootstrapper
						var instance = new modules[moduleName]();
						if (instance) {
							var prototype = Object.getPrototypeOf(instance);
							if (prototype) {
								recurseIntrospect(prototype, results[moduleName]);
							}
						}
					} else {
						recurseIntrospect(module, results[moduleName]);
					}
				} catch (e) {
					transmit({
						exception : {
							name : e.name,
							message : e.message,
							stack : e.stack.toString()
						}
					}, exit);
				}
			}
			process.stdout.write(_safeStringify({
				message : {
					introspect : results
				}
			}) + ',');

		};

		u = require('util');
		var log = function(value) {
			transmit({
				"console.log" : value
			}); 
		};
		console.log = log; 
		console.error = log;
		console.info = log;
		console.warn = log;
		
		context.setTimeout = setTimeout;
		context.clearTimeout = clearTimeout;
		
		if (req) {
			for (var i = 0; i < req.length; i++) {
				var m = req[i].module;
				var o = req[i].options;
				if (o) {
					var cache = new moduleCache(m);
					o.getCache = function () {
						return cache.getCache();
					};
					o.saveCache = function (c) {
						return cache.saveCache(c);
					};
				}

				segments = m.split('/');
				var name = segments[segments.length - 1];
				transmit({
					'trace' : {
						message : 'Loading module: ' + m
					}
				});
				context[name] = require(m);
				if (!context[name])
					transmit({
						'exception' : {
							message : 'message: error require: ' + m
						}
					}, exit);
				if (o) {
					try {
						context[name] = new context[name](o);
					} catch (err) {
						transmit({
							'exception' : {
								message : "Could not create instance: " + u.inspect(err)
							}
						});
					}
				}
			}
		}

		// Introspect only the modules
		if (introspect)
			introspector(context);

		context.console = console;
		context.require = _require;
		context.Q = Q;
		context._safeStringify = _safeStringify;
		if (global) {
			var msg = "Snippet Globals: ";
			for ( var prop in global) {
				context[prop] = global[prop];
				msg += prop + " ";
			}
			transmit({
				'trace' : {
					message : "setting Global: " + prop ? prop : "<no globals>"
				}
			});
		}

		var safeUserScript = Script.runInContext('(' + main.toString() + ')()', context);

		try {
			safeUserScript({
				send : transmit
			}, script);
		} catch (e) {
			transmit({
				exception : {
					name : e.name,
					message : e.message,
					stack : e.stack.toString()
				}
			}, exit);
		}
	} catch (e) {
		transmit({
			exception : {
				name : e.name,
				message : e.message,
				stack : e.stack.toString()
			}
		}, exit);
	}
}

function main() {
	var global = this;

	/* jshint evil:true */
	function userScript(script, _callback) {
		return Function("_callback", 'return eval(' + _safeStringify(script + '') + ')');
	}
	/* jshint evil:false */

	return function run(communicator, sourceCode) {
		"use strict";

		var log = function(value) {
			communicator.send({
				"console.log" : value
			});
		};
		var print = function(value) {
			communicator.send({
				print : value
			});
		};

		global.print = print.bind(global);

		var result = userScript(sourceCode)(function(cbresult) {
			if (!cbresult)
				cbresult = "No Result";
			if (cbresult instanceof Error)
				cbresult = {
					error : cbresult.message
				};
			communicator.send({
				result : cbresult
			}, function() {
				process.exit(0);
			});
		});

		var promiseResult = Q.isPromise(result);
		if (result!=undefined && result!=null && !promiseResult)
			communicator.send({
				result : result
			}, function() {
				process.exit(0);
			});
		else {
			if (result && promiseResult) {
				communicator.send({
					'waiting' : {
						message : "Evaluation finished and a promise was returned.\r\nWaiting 60 seconds for promise to be fulfilled."
					}
				});
				result.then (function (result){ // recived a promise
					communicator.send({
						'result' : result
					}, function() {
						process.exit(0);
					});
				}).fail(function (err){
					communicator.send({
						'exception' : err.message
					}, function() {
						process.exit(0);
					});
				});
			}
			else { // no result
				communicator.send({
					'waiting' : {
						message : "Evaluation finished but nothing returned.\r\nWaiting 60 seconds for _callback()."
					}
				});
			}
		}
	};
}
