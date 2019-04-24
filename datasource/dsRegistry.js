'use strict'

/**
 * DataSource module 
 * The datasource module contains a DataSource interface definition, all of concrete storage type should
 * implement this interface. And also, expose a datasource factory class for datasource creation
 *
 * @author lizh
 */

var logger                = require('../services/logUtil').getLogger('chanquan:dsFactory');
let MongoDataSource      = require('./mongoDS');
let RedisDataSource      = require('./redisDS');
let Q                    = require('q');

let DATA_SOURCES_CLZ = [MongoDataSource, RedisDataSource];

/**
 * class for create a data source instance by conf
 *
 */ 
class DataSourceFactory {
  constructor() {
    // do nothing	
	}

	static isSupported (type) {
    if (! type) return false;
		if ('' === type.trim()) return false;
    
		let isSupportedDS = false;

    DATA_SOURCES_CLZ.some(function (dsClz) {
	    if (dsClz.getType().toLowerCase() === type.toLowerCase()) {
		    isSupportedDS = true;
				return true;
			}	
		});
		return isSupportedDS;
	}

  create(type, conf, callback) {
     if (! DataSourceFactory.isSupported(type)) {
			 logger.error('Invalid data source type: ' + type);
			 throw new Error('Invalid datasource: ' + type);
		 }

		 let dsClz = null;
		 DATA_SOURCES_CLZ.some(function (_dsClz) {
		    if (_dsClz.getType() === type) {
	         dsClz = _dsClz;
					 return true;
				} 
		 });

    let dsInst = new dsClz(conf); 
		dsInst.init(callback);
		return dsInst;
	}
}

let DSRegClz = (function() {
  let DATASOURCE_REGISTRY_NAME = 'DataSourceRegistry';	
	let ENV_CONF = null;
	let DATASOURCE_REGISTRY_SINGLETON = null;
  let _dspool = {};
	let _dsFactory = new DataSourceFactory();

	/**
	 * The class for data source registry
	 */
	class DataSourceRegistry {
		constructor () {

		}
    /**
		 * The data providers configuration
		 * e.g:
		 *
	   * {
     *    "MonitorDataSource": {
		 *      "DriverType":  "mongodb",
		 *		  "dbname": "nonghe_monitor",
		 *		  "host": "localhost",
	   *		  "port": "27017",
		 *		  "user": "",
		 *		  "password": ""
		 * }	
		 */
		static get ENV_CONF() {
			return ENV_CONF;	     
		}

		static set ENV_CONF(env){
			ENV_CONF = env; 
		}

		static get INSTANCE() {
			if (DATASOURCE_REGISTRY_SINGLETON) return DATASOURCE_REGISTRY_SINGLETON;

			if (! ENV_CONF) {
		    throw new Error('Invalid ENV_CONF value: ' + ENV_CONF);	
			}

		  DATASOURCE_REGISTRY_SINGLETON = new DataSourceRegistry();
			return DATASOURCE_REGISTRY_SINGLETON;
		}
    
		/**
		 * get data source registry name
		 *
		 */
		getName() {
	    return DATASOURCE_REGISTRY_NAME;	
		}
    
		/**
		 * Initliaze method
		 * @param {function}, callback
		 */
		init(callback) {
			let promises = [];
      
			Object.keys(ENV_CONF).forEach(function(dataSourceName) {
				if (! dataSourceName)  {
					logger.error('Invalid data source name: ' + dataSourceName);
					return;
				}
        
        if (! ENV_CONF[dataSourceName].DriverType) {
					logger.error('Invalid data source without  a driver type: ', ENV_CONF[dataSourceName]);
					return;
				}

				let matchedDSClz = null;
				DATA_SOURCES_CLZ.some(function(dsclz) {
			     if (dsclz.getType().toLowerCase() === ENV_CONF[dataSourceName].DriverType.toLowerCase()) {
					    matchedDSClz = dsclz;
							return true;
					 }
					 return false;
				});

				if (! matchedDSClz) {
					logger.error('Unsupported datasource type: ' + ENV_CONF[dataSourceName].DriverType);
				}

				let deferred = Q.defer();
				promises.push(deferred.promise);
				let conf = ENV_CONF[dataSourceName];
				conf.name = dataSourceName;

				_dsFactory.create(matchedDSClz.getType(), conf, function (err, result) {
					if (err) {
						return deferred.reject(err); 
					} 
					_dspool[conf.name] = result;
					return deferred.resolve(result); 
				});// end of init call
			});// end of data providers loop
			
			return Q.allSettled(promises).then(function (results) {
				results.some(function (result) {
					if (result.state !== 'fulfilled') {
						throw result.reason;
					}
				});  
			}).then (function () {
				return true; 
			}).nodeify(callback);
		}

    /**
		 * Get data source instance by data source name
		 *
		 * @param {string}, datasource name
		 *
		 * @return {Object}, datasource instance
		 */
		getDS (name) {
	    return _dspool[name];
		}
	}
	return DataSourceRegistry;
})();

module.exports = exports = DSRegClz; 
