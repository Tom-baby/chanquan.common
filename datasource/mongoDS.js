'use strict'

/**
 * DataSource module 
 * The datasource module contains a DataSource interface definition, all of concrete storage type should
 * implement this interface. And also, expose a datasource factory class for datasource creation
 *
 * @author lizh
 */

let mongoose             = require('mongoose');
let Q                    = require('q');
var logger               = require('../services/logUtil').getLogger('chanquan:mongo-datasource');
let Scheduler            = require('../services/scheduler').Scheduler;
let SchedulerTask        = require('../services/scheduler').SchedulerTask;
let SchedulerTaskFactory = require('../services/scheduler').SchedulerTaskFactory;
let DataSource           = require('./datasource');

let MONGO_DATASOURCE_DRIVER_TYPE = 'mongodb';
let DEFAULT_RECONNECT_INTERVAL = 1 * 1000;

/**
 * Reconnect task for MongoDB datasource
 */
class RetryConnectTask extends SchedulerTask {
	constructor (ds, name) {
		super(name);
		this._ds = ds;
	}

	/**
	 * Task name
	 */
	getName() {
		return this._name;	
	}

	/**
	 * Run method for retry connection task
	 */
	run () {
		let self = this;

		// fire start event	
		self.emit(SchedulerTask.START_EVENT);

		self._ds.init(function (error, result) {
			if (error) {
				self.emit(SchedulerTask.FAILED_EVENT, error);	
				return;
			}
			self.emit(SchedulerTask.END_EVENT);
		});	
	}
}

/**
 * Schedule task factory for create a reconnect task which perform reconnect to  mongodb
 *
 * @private
 */
class RetryConnectTaskFactory extends SchedulerTaskFactory {
   constructor (mongoDS) {
	   super();
		 this._taskid = 0;
		 this._mongoDS = mongoDS; 
	 }

   create () {
		 this._taskid++;
	   return new RetryConnectTask(this._mongoDS, 'MongoDB-ReConnect-Task[' + this._taskid + ']');
	 }
}

/**
 * Data source implementation for MongoDB
 *
 * @private
 */
class MongoDataSource extends DataSource {
	constructor (conf) {
		super();
		this._conf = conf;	
		this._conn = null;
		this._scheduler = null;

	} 

	static getType() {
		return MONGO_DATASOURCE_DRIVER_TYPE;	
	}

	static get RETRY_INTERVAL() {
    return DEFAULT_RECONNECT_INTERVAL;	
	}

  getName() {
    return this._conf.name;	
	}

	/**
	 * Return/create a mongoose connection
	 *
	 * @param {function}, callback(error, connection), return a mongoose connection
	 */
	init (callback) {
		let self = this;
		
		if (self._conn && self._conn.readyState === 1) {
     if (callback) { 
			 return callback(null, self);	
		 }
		 return;
		}

	 if (self._conn) {
	    self._conn.removeAllListeners();
			self._conn = null;
	 }
		
		let options = {
			db: {native_parser: true},
			server: {poolSize: 10, socketOptions: {keepAlive: 1, connectTimeoutMS: 30000, auto_reconnect:true}}
		};

		if (self._conf.user) {
			options.user = self._conf.user;
			options.pass = self._conf.password;
		}

		let db = null;
		try {
			logger.debug('About to connect to MongoDB [host]: ' + self._conf.host + ', [port]: ' + self._conf.port + ', [user]: ' + options.user + ', [password]: ' + ((options.pass) ? '********' : ''));
			let dbname = self._conf.dbname;
			if (! dbname) {
				logger.error('Error:  missing dbname');
				return callback(new Error('Missing dbname'));
			}

			db =  mongoose.createConnection(self._conf.host, dbname, self._conf.port, options);

			db.on('connecting', function() {
				logger.debug('MongoDB data source is connecting');
			});

			db.on('connected', function () {
				logger.debug('MongoDB data source is connected');
        self._conn = db;
				self._scheduler = null;
				if (callback) { 
					callback(null, self);
			  }
			});

			db.on('disconnecting', function () {
				logger.debug('MongoDB data source is disconnecting');
			});

      db.on('disconnected', function () {
				logger.debug('MongoDB data source is disconnected');
				
				if (! self._scheduler) {
					// trigger reconnect
			    self.getConnection();	
				}
			});

      db.on('error', function (error) {
				// if mongodb is not started, on-error event will be triggered
				logger.error('MongoDB data source failed to connect database due to: ', error);
				if (callback) {
					return callback(error);
				}
			});
		} catch (err) {
			logger.error('Error occurs during creating  mongodb connection due to:', err);
			callback(err);
		}
	}
  
	/**
	 * Return a mongoose db connection
	 * 
	 * @return {object}, mongoose connection
	 *
	 */
	getConnection() {
		let self = this;
    
		if (self._conn && self._conn.readyState === 1) {
	    return self._conn;	
		}

		if (self._scheduler) {
	    return self._conn;	
		}

		logger.debug('Reconnect to DB under background due to invalid mongoose connection status: ', ((self._conn) ? self._conn.readyState  : null));
		try {
			let schFactory = new RetryConnectTaskFactory(self);
			let scheduler = new Scheduler(schFactory, MongoDataSource.RETRY_INTERVAL);
			
			scheduler.on(Scheduler.START_EVENT, function () {
				logger.debug('Trying to reconnect to mongodb');
			});

			scheduler.on(Scheduler.END_EVENT, function () {
				logger.debug('Reconnected to mongodb, cancel the retry scheduler');
				scheduler.cancel();
			});

			scheduler.on(Scheduler.FAILED_EVENT, function (error) {
				logger.debug('Try to get  mongodb connection, but failed, will try again within ' + MongoDataSource.RETRY_INTERVAL/1000 + ' seconds');
			});

			logger.debug('Scheduler start to retry obtaining the connection to mongodb');
			scheduler.start();
			self._scheduler = scheduler;
		} catch (e) {
			logger.error('Reconnect to mongodb failed, due to : ', e);
		}

		return self._conn;	
	}
}

module.exports = exports = MongoDataSource; 
