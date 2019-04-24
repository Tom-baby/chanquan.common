'use strict'

/**
 * DataSource module 
 * The datasource module contains a DataSource interface definition
 *
 * @author lizh
 *
 */


/**
 * Abstract interface definition for data source
 *
 * @public
 */

class DataSource {
	constructor () {
		// do nothing	
	}

	static getType() {
		throw new Error('Can not call the abstract method');	
	}

	getName() {
		throw new Error('Can not call the abstract method');	
	}

 /**
	* Init datasource
	* @param {function}, callback(error, connection)
	*
	*/
	init (callback) {
		throw new Error('Can not call the abstract method');	
	}

 /**
	* Get connection from datasource
	*
	* @return {object}, dbConnection
	*/
	getConnection () {
		throw new Error('Can not call the abstract method');	
	}
}

module.exports = exports = DataSource;

