'use strict'

/**
 * Bootstrap module 
 * 
 * The server startup should come after a serials service become ready
 * The bootstrap module will collect the initalizers and make sure each of them 
 * is ready to go, then get to next execution phase
 *
 * @author lizh
 *
 */

let Q                    = require('q');
var logger                = require('../services/logUtil').getLogger('chanquan:bootstrap');
let Orchestrator         = require('orchestrator');

/**
 * Bootstrap class, singleton class which is used to manage 
 * initalizers and start up them before get ready to provide services
 *
 */
class Bootstrap {
	constructor () {
		this._initializers = [];	
	}

	/**
	 * Add a new initializer to bootstrap
	 *
	 * @param {Initializer} , initializer
	 *
	 */
	register (initializer) {
		if (! initializer) return;
		this._initializers.push(initializer);
	}

	/**
	 * Remove the initializer from bootstrap queue by name
	 * @param {string}, name
	 *
	 */
	unregister (name) {
		if (this._initializers.length === 0) return;
		if (! name) return;
		for (let i = this._initializers.length -1; i >= 0; i--) {
			let initializer = this._initializers[i];
			if (initializer.getName() === name) {
				this._initializers.splice(i, 1); 
			}
		}
	}

	/**
	 * Run the initializers
	 * 
	 * @param {function}, callback(error, boolean), callback method to pass back the result of bootstrap
	 *
	 * @return {promise}, true|false, true for successfully bootstrap, false for failed to bootstrap
	 */
	init (callback) {
		let self = this;
		if (! self._initializers || self._initializers.length === 0) {
			return Q(true).nodeify(callback); 
		}

		let tasknames = [];
		let orchestrator = new Orchestrator();
		
		self._initializers.forEach(function(item) {
			let taskDeps = tasknames.slice(0, tasknames.length);
			orchestrator.add(item.getName(), taskDeps, item.init.bind(item));
			tasknames.push(item.getName());
		});

		let deferred = Q.defer();
		orchestrator.start(tasknames, function(error) {
			if (error) {
				logger.error('Orchestrator execution failed by : ', error);
		    return deferred.reject(error);	
			}

			return deferred.resolve(true);
		});

		return deferred.promise.nodeify(callback);
	}
}

let bootstrap = new Bootstrap();

// singletone per node process
module.exports = exports = bootstrap;

// test cases

// bootstrap.register({
// 	getName: function() {
//     return 'task-1';
// 	},
// 
// 	init: function(cb) {
//     debug('executing task-1');
// 		cb(null, true); 	
// 	}
// });
// 
// bootstrap.register({
// 	getName: function() {
//     return 'task-2';
// 	},
// 
// 	init: function(cb) {
//     debug('executing task-2');
// 		cb(null, true); 	
// 	}
// });

// bootstrap.init(function(error, result) {
//  debug('result: ', result);
// });
