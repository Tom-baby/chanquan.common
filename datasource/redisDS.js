'use strict'

/**
 * DataSource module 
 * The datasource module contains a DataSource interface definition, all of concrete storage type should
 * implement this interface. And also, expose a datasource factory class for datasource creation
 * 
 * @author lizh
 */

let redis                 = require('redis');
let Q                     = require('q');
var logger                = require('../services/logUtil').getLogger('chanquan:redis-datasource');
let DataSource            = require('./datasource');

let REDIS_DATASOURCE_DRIVER_TYPE = 'redis';

/**
 * Data source implementation for Redis  
 *
 * @private
 */
class RedisDataSource extends DataSource {
	constructor (conf) {
		super();
		this._conf = conf;	
		this._conn = null;
	} 

	static getType() {
		return REDIS_DATASOURCE_DRIVER_TYPE;	
	}

	getName () {
   return this._conf.name;	
	}

	/**
	 * Return/create a mongoose connection
	 *
	 * @param {function}, callback(error, connection), return a mongoose connection
	 */
	init (callback) {
		let self = this;

		if (! self._conf) {
			logger.error('Invalid redis client conf: ' + self._conf + ', abort to create redis connection');
	    return callback(null, null);	
		}
		
		if (self._conn) {
     if (callback) { 
			 callback(null, self);	
		 }
		 return;
		}
		
		try {
			logger.debug('About to connect to Redis [host]: ' + self._conf.host + ', [port]: ' + self._conf.port + ', [user]: ' + self._conf.user + ', [password]: ' + ((self._conf.pass) ? '********' : ''));

			let db = redis.createClient(self._conf.port, self._conf.host);
			db.on('connect', function() {
				logger.debug('Redis client connected');
				self._conn = db;
				if (callback) { 
					callback(null, self);
			  }
			});

			db.on("error", function (error) {
				logger.error('Redis client failed to connect, due to: ', error);
				if (callback) {
					return callback(error);
				}
			});
		} catch (err) {
			logger.error('Error occurs during creating  redis connection due to:', err);
			callback(err);
		}
	}
  
	/**
	 * Return a redis db client
	 * 
	 * @return {object},redis client connection
	 *
	 */
	getConnection() {
		let self = this;
		return self._conn;	
	}
}

module.exports = exports = RedisDataSource; 
