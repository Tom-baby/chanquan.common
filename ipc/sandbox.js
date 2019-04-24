/**
 * Dyanmical invocation sandbox class which is used 
 * to proxy the invocation from ipc client to the target module 
 * which running in a sandbox VM environment in a separate process
 *
 * @author lizh
 */

var logger                = require('../services/logUtil').getLogger('chanquan:sandbox');
var fs              = require('fs');
var util            = require('util');

var bootstrap       = require ('./bootstrapper');  // make sure it compiles
var path            = require('path');
var spawn           = require('child_process').spawn;

var DEBUG = false;  // If you set this one to true, the target VM will come up in debug mode and stop on port DEBUGPORT
var DEBUGPORT= 7000;
var defaulttimeout = DEBUG ? 1000 * 60 * 60 : 1000 * 60;
var _moduleCache = {};

/**
 *
 * @param {options}
 *     options include: timeout, { module, options } 
 **/
function Sandbox(options) {
	/* jshint proto:true */
	(this.options = options || {}).__proto__ = Sandbox.options;
	/* jshint proto:false */
	if (DEBUG)
		this.options.timeout = defaulttimeout;
	if (! this.options) {
		this.options.require = [];
	}

	this.options.global = options.global || {};
	if (!this.options.introspect)
		this.options.introspect = false;
}

var output = function (handlers, message) {
	_self = this;
	if (!!message) {
		logger.debug("sandbox: message: "+message);
		try {
			var array;
			var msg = _self.chunkspace ? _self.chunkspace + message : message;
			try {
				array = JSON.parse('[' + msg.toString() + 'null]'); 
				_self.chunkspace = undefined;
			} catch (err) {
				if (_self.chunkspace)
					_self.chunkspace += message;
				else
					_self.chunkspace = message;
				logger.debug ("sandbox: message: chunk");
				return;
			}
			_self.chunkspace = null;
			array.pop(); // Here we pop last `null`

			for (var i = 0; i < array.length; i++) {
				var value = array[i];
				if (value) {
					if ('message' in value) {
						message = value.message;

						for (var handler in handlers) {
							if (handlers.hasOwnProperty(handler) && handler in message) {
								handlers[handler](message[handler]);
							}
						}
					}
				}
			}
		} catch (err) {
			logger.error(err);
		}
	}
};

// TODO holding all in memory ... with many mudule, need to persist it somewhere
// Return a subset of the cache configuration needed by the required modules
function getCurrentCache(requiredList) {
	var cache = {};
	requiredList.forEach (function (r){
		var module = r.module.replace(/.*\//,"");
			if (_moduleCache[module])
				cache[module] = _moduleCache[module];
	});
	return cache;
}

function defaultCacheHandler (msg) {
	if (!msg.module || !msg.cache)
		logger.error("Invalid cache.save message type");
	else {
		_moduleCache[msg.module] = msg.cache;
		logger.debug("Cached data for module: "+msg.module);
	}
}

/**
 * Run a script in this instance of secured sandbox
 * 
 * @param {String}
 *            [script] the script to execute
 * @param {Object} [
 *            handlers ] optional a list of callbacks for outputs from the target VM ... see getDefaultHandler
 */
Sandbox.prototype.run = function(script, handlers) {
	var _self = this;

	if (_self.running)
		throw new Error ("Already running");

	_self.timer = null;
	_self.handlers = handlers;

	var args = [];
	if (DEBUG)
		args.push('--debug-brk=' + DEBUGPORT);
	args.push(this.options.bootstrapper);
	if (!handlers)
		handlers = Sandbox.getDefaultHandlers();

	if (!handlers['cache.save'])
		handlers['cache.save'] = defaultCacheHandler;

	var child = spawn(process.argv[0], args);
	logger.debug("spawn js sandbox: " + process.argv[0] + " " + args.join(', '));

	_self.running = true;
	_self.child = child;

	child.on('exit', function(code) {
		_self.running = false;
		clearTimeout(_self.timer);
		delete _self.timer;
		handlers['exit']({
			exit : 'vm exit code:' + code
		});
	});
	child.stdout.on('data', output.bind(this, handlers));

	try {
		child.stdin.write(JSON.stringify({
			script : script,
			require : this.options.require,
			global : this.options.global,
			introspect : this.options.introspect,
			cache: getCurrentCache(this.options.require)
		}), function() {
			if (!child.connected) {
				// clearTimeout(_self.timer);
				// output(handlers, JSON.stringify({message: { exception: 'run: script request failed'}}) + ',');
				// child.kill('SIGKILL');
			}
		});
	} catch (err) {
		handlers['exception']({
			run : "script request failed",
			error : err
		});
		child.kill('SIGKILL');
		return;
	}

	_self.timer = setTimer (child, _self.options.timeout, _self.handlers['timeout']); 
};

function setTimer (child, timeout, timeouthandler) {
	return setTimeout(function() {
		child.stdout.removeListener('output', output);
		child.kill('SIGKILL');
		timeouthandler("Timeout exception, sanbox killed");
	}, timeout);
}

Sandbox.prototype.timerRest = function () {
	if (this.running) {
		if (!this.timer)
			throw ("Should not be here; running with no timer");
		logger.debug("sandbox timer reset()");
		clearTimeout(this.timer);
		this.timer = setTimer (this.child, this.options.timeout, this.handlers['timeout']);
	}
	else
		logger.debug("sandbox timer reset: No running sandbox");
};

Sandbox.getDefaultHandlers = function() {
	return {
		'console.log' : function(msg) {
			logger.debug(util.inspect(msg));
		},
		'print' : function(msg) {
			logger.debug(util.inspect(msg));
		},
		'timeout' : function(msg) {
			logger.error(msg);
		},
		'exception' : function(msg) {
			logger.error(util.inspect(msg));
		},
		'result' : function(msg) {
			logger.debug('Sandbox Result: ' + msg);
		},
		'exit' : function(msg) {
			logger.debug('Sandbox processs exited, process exitcode: ' + msg);
		},
		'introspect' : function(msg) {
			// do nothing
		},
		'cache.save' : defaultCacheHandler,
		'waiting': function (msg) {
			logger.debug('waiting: ' + msg);
		},
		'trace': function (msg) {
			logger.debug('trace: ' + msg);
		}
	};
};

Sandbox.options = { timeout: defaulttimeout, bootstrapper: path.join(__dirname, '/bootstrapper.js') };

module.exports = exports = Sandbox;
