/**
 * Created by zeqi
 * @description For data interaction
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File dataHelper
 * @Date 16-12-26
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var logger  = require('./logUtil').getLogger('chanquan:common:services:DataHelper');
var Q       = require('q');
var qs      = require('qs');

var HttpService = require('./httpService');

/**
 * Responsible for data exchange
 *
 * @class DataHelper
 */
class DataHelper {

  /**
   * Creates an instance of DataHelper.
   *
   * @param baseUrl {string} logic base url
   * @param httpService {HttpService} http service instance
   *
   * @memberOf DataHelper
   * @constructor
   */
  constructor(baseUrl, httpService) {
    this.baseUrl = baseUrl;
    this.httpService = httpService;
  }

  /**
   * Check item data service is DataHelper object
   * @param dataService {object} {tenant: new DataHelper(), portal: new DataHelper()}
   * @param services {Array|string} ex:['tenant', 'portal', 'organization', 'tnews', 'partner']
   * @returns {boolean}
   */
  static checkDataService(dataService, services) {
    var self = this;
    var method = 'checkDataService';
    if (typeof dataService != 'object') {
      return false;
    }
    if (typeof services == 'string') {
      services = [services];
    }

    if (Array.isArray(services)) {
      for (var i = 0; i < services.length; i++) {
        var item = dataService[services[i]];
        if (!item || !(item instanceof DataHelper)) {
          logger.warn(method, services[i] + ' data service invalid');
          return false;
        }
      }
    }
    else {
      for (var i in dataService) {
        var item = dataService[i];
        if (!item || !(item instanceof DataHelper)) {
          logger.warn(method, i + ' data service invalid');
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Get logic base url
   *
   * @readonly
   * @memberOf DataHelper
   */
  get baseUrl() {
    return this._baseUrl;
  }

  /**
   * Set logic base url
   *
   *
   * @memberOf DataHelper
   */
  set baseUrl(baseUrl) {
    this._baseUrl = DataHelper.baseUrlHandler(baseUrl);
    if (!this.baseUrl) {
      throw {
        errorCode: 500,
        reason: 'Invalid dataHelper baseUrl:' + JSON.stringify(baseUrl)
      };
    }
  }

  /**
   * Get http service instance
   *
   * @readonly
   * @memberOf DataHelper
   */
  get httpService() {
    return this._httpService;
  }

  /**
   * Set http service instance
   *
   *
   * @memberOf DataHelper
   */
  set httpService(httpService) {
    if (DataHelper.validationHttpService(httpService))
      this._httpService = httpService;
  }

  /**
   * The handler for logic base url
   *
   * @static
   * @param baseUrl {string}
   * @returns {string}
   *
   * @memberOf DataHelper
   */
  static baseUrlHandler(baseUrl) {
    if (typeof baseUrl != 'string') {
      return null;
    }

    if (baseUrl.substr(0, 1) != '/') {
      baseUrl = '/' + baseUrl;
    }

    if (baseUrl.substr(baseUrl.length - 1, 1) == '/') {
      baseUrl = baseUrl.substr(0, baseUrl.length - 2);
    }
    return baseUrl;
  }

  /**
   * Error handler
   *
   * @static
   * @param {any} error
   * @param {number} errorCode
   * @returns
   *
   * @memberOf DataHelper
   */
  static resError(error, errorCode) {
    var self = this;
    var method = 'resError';
    errorCode = errorCode || 400;
    try {
      if (typeof error == 'string') {
        return {errorCode: errorCode, message: error};
      }
      else if (typeof error == 'object') {
        if (error.response) {
          var response = error.response;
          if (response.body) {
            if (typeof response.body == 'string') {
              return {errorCode: response.status, message: response.body};
            }
            else if (typeof response.body == 'object' && response.body.reason) {
              return {errorCode: response.status, message: response.body.reason};
            }
            else if (typeof response.body == 'object' && response.body.message) {
              return {errorCode: response.status, message: response.body.message};
            }
            else if (response.text) {
              return {errorCode: response.status, message: response.text};
            }
          }
        }
        else if (error.body) {
          if (typeof error.body == 'string') {
            return {errorCode: error.status, message: error.body};
          }
          else if (typeof error.body == 'object' && error.body.reason) {
            return {errorCode: error.status, message: error.body.reason};
          }
          else if (typeof error.body == 'object' && error.body.message) {
            return {errorCode: error.status, message: error.body.message};
          }
        }
        else if (error.message) {
          return {errorCode: errorCode, message: error.message};
        }
      }
    }
    catch (e) {
      if (error.text) {
        return {errorCode: error.status || 500, message: error.text};
      }
      return {errorCode: 500, message: error};
    }
    if (error.text) {
      return {errorCode: error.status || 500, message: error.text};
    }
    return {errorCode: 500, message: error};
  };

  /**
   * Validation http service instance
   *
   * @static
   * @param {HttpService} httpService
   * @returns
   *
   * @memberOf DataHelper
   */
  static validationHttpService(httpService) {
    if (!(httpService instanceof HttpService)) {
      throw {
        errorCode: 500,
        reason: 'Invalid httpService:' + JSON.stringify(httpService)
      };
    }
    return true;
  }

  /**
   * Get http service instance
   *
   * @static
   *
   * @memberOf DataHelper
   */
  static get httpService() {
    return this._httpService;
  }

  /**
   * Validation http service instance
   *
   * @static
   *
   * @memberOf DataHelper
   */
  static set httpService(httpService) {
    if (DataHelper.validationHttpService(httpService))
      this._httpService = httpService;
  }

  /**
   * Get data by url api and condtion.
   *
   * @static
   * @param {string} url
   * @param {Object} condition
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  static get(url, condition, callback) {
    var self = this;
    var method = 'get';
    url = this.baseUrlHandler(url);
    if (!url) {
      return Q.reject('请提供完整的url').nodeify(callback);
    }
    var path = url;

    if (condition && Object.keys(condition).length > 0) {
      path += '?' + qs.stringify(condition);
    }
    return self.httpService.get(path).then(data => {
      var result = data.body;
      logger.debug(method, '[path]:', path, '[condition]:', condition, '[data]:', result);
      return result;
    }).fail(error => {
      logger.warn(method, '[path]:', path, '[condition]:', condition, '[error]:', error);
      throw self.resError(error);
    }).nodeify(callback);
  }

  /**
   * Put doc by url api.
   *
   * @static
   * @param {string} url
   * @param {Object} body
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  static put(url, body, callback) {
    var self = this;
    var method = 'put';
    url = this.baseUrlHandler(url);
    if (!url) {
      return Q.reject('请提供完整的url').nodeify(callback);
    }
    var path = url;
    return self.httpService.put(path, body).then(data => {
      var result = data.body;
      logger.debug(method, '[path]:', path, '[body]:', body, '[data]:', result);
      return result;
    }).fail(error => {
      logger.error(method, '[path]:', path, '[body]:', body, '[error]:', error);
      throw self.resError(error);
    }).nodeify(callback);
  }

  /**
   * Patch doc by url api.
   *
   * @static
   * @param {string} url
   * @param {Object} body
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  static patch(url, body, callback) {
    var self = this;
    var method = 'patch';
    url = this.baseUrlHandler(url);
    if (!url) {
      return Q.reject('请提供完整的url').nodeify(callback);
    }
    var path = url;
    return self.httpService.patch(path, body).then(data => {
      var result = data.body;
      logger.debug(method, '[path]:', path, '[body]:', body, '[data]:', result);
      return result;
    }).fail(error => {
      logger.error(method, '[path]:', path, '[body]:', body, '[error]:', error);
      throw self.resError(error);
    }).nodeify(callback);
  }

  /**
   * Post doc by url api.
   *
   * @static
   * @param {string} url
   * @param {Object} body
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  static post(url, body, callback) {
    var self = this;
    var method = 'post';
    url = this.baseUrlHandler(url);
    if (!url) {
      return Q.reject('请提供完整的url').nodeify(callback);
    }
    var path = url;
    return self.httpService.post(path, body).then(data => {
      var result = data.body;
      logger.debug(method, '[path]:', path, '[body]:', body, '[data]:', result);
      return result;
    }).fail(error => {
      logger.error(method, '[path]:', path, '[body]:', body, '[error]:', error);
      throw self.resError(error);
    }).nodeify(callback);
  }

  /**
   * Delete doc by url api.
   *
   * @static
   * @param {string} url
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  static delete(url, callback) {
    var self = this;
    var method = 'delete';
    url = this.baseUrlHandler(url);
    if (!url) {
      return Q.reject('请提供完整的url').nodeify(callback);
    }
    var path = url;
    return self.httpService.delete(path).then(data => {
      var result = data.body;
      logger.debug(method, '[path]:', path, '[data]:', result);
      return result;
    }).fail(error => {
      logger.error(method, '[path]:', path, '[error]:', error);
      throw self.resError(error);
    }).nodeify(callback);
  }

  /**
   * Aggregate doc by url api.
   *
   * @static
   * @param {string} url
   * @param {Array} pipeline
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  static search(url, pipeline, callback) {
    var self = this;
    var method = 'search';
    url = this.baseUrlHandler(url);
    if (!url) {
      return Q.reject('请提供完整的url').nodeify(callback);
    }
    var path = url;
    return self.httpService.search(path, pipeline).then(data => {
      var result = data.body;
      logger.debug(method, '[path]:', path, '[pipeline]:', pipeline, '[data]:', result);
      return result;
    }).fail(error => {
      logger.error(method, '[path]:', path, '[pipeline]:', pipeline, '[error]:', error);
      throw self.resError(error);
    }).nodeify(callback);
  }

  /**
   * The handler for logic base url
   *
   * @param {string} baseUrl
   * @returns {string}
   *
   * @memberOf DataHelper
   */
  baseUrlHandler(baseUrl) {
    return DataHelper.baseUrlHandler(baseUrl);
  }

  /**
   * Error handler
   *
   * @param {any} error
   * @param {number} errorCode
   * @returns {Object}
   *
   * @memberOf DataHelper
   */
  resError(error, errorCode) {
    return DataHelper.resError(error, errorCode);
  };

  /**
   * Get data by url.
   *
   * @param {string} url
   * @param {Object} condition
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  getByUrl(url, condition, callback) {
    DataHelper.httpService = this.httpService;
    return DataHelper.get(url, condition, callback);
  }

  searchByUrl(url, pipeline, callback) {
    DataHelper.httpService = this.httpService;
    return DataHelper.search(url, pipeline, callback);
  }

  /**
   * Get a doc by doc id.
   *
   * @param {string} id
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  getById(id, callback) {
    var self = this;
    if (!id) {
      return Q.reject('请提供记录id').nodeify(callback);
    }
    var path = self.baseUrl;
    path += '/' + id;
    return self.getByUrl(path);
  }

  /**
   * Get a data list by condtion.
   *
   * @param {Object} condition
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  query(condition, callback) {
    var self = this;
    var path = self.baseUrl;
    return self.getByUrl(path, condition, callback);
  }

  /**
   * Get data count by condition.
   *
   * @param {Object} condition
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  count(condition, callback) {
    var self = this;
    var path = self.baseUrl;
    path += '/count';
    return self.getByUrl(path, condition, callback);
  }

  /**
   * Aggregate collection docs
   * @param condition {object}
   * @param pipeline {Array}
   * @param callback {function} call back
   * @returns {Promise}
   */
  aggregate(condition, pipeline, callback) {
    var self = this;
    var path = self.baseUrl;
    path += '/aggregation';
    if (condition && Object.keys(condition).length > 0) {
      path += '?' + qs.stringify(condition);
    }
    return self.searchByUrl(path, pipeline, callback).nodeify(callback);
  }

  /**
   * Get data list and data count.
   * @param condition {Object}
   * @param callback {function}
   * @returns {Promise|Request|Promise.<TResult>|*}
   * @memberOf DataHelper
   */
  queryDataAndCount(condition, callback) {
    var self = this;
    var promises = [self.query(condition), self.count(condition)];
    return Q.allSettled(promises).then(data=> {
      if (data && Array.isArray(data) && data.length == 2) {
        var count = 0;
        if (data[1].value.count) {
          count = data[1].value.count;
        }
        return {data: data[0].value || [], count: count || 0};
      }
      return null;
    }).nodeify(callback);
  }

  /**
   * Put a doc by doc id.url.
   * @param {string} id
   * @param {Object} body
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  putByUrl(url, body, callback) {
    DataHelper.httpService = this.httpService;
    return DataHelper.put(url, body, callback);
  }

  /**
   * Put a doc by doc id.
   *
   * @param {string} id
   * @param {Object} body
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  putById(id, body, callback) {
    var self = this;
    if (!id) {
      return Q.reject('请提供记录id').nodeify(callback);
    }
    var path = self.baseUrl;
    path += '/' + id;
    return self.putByUrl(path, body, callback);
  }

  /**
   * Patch a doc by url.
   *
   * @param {string} url
   * @param {Object} body
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  patchByUrl(url, body, callback) {
    DataHelper.httpService = this.httpService;
    return DataHelper.patch(url, body, callback);
  }

  /**
   * Patch a doc by doc id.
   *
   * @param {string} id
   * @param {Object} body
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  patchById(id, body, callback) {
    var self = this;
    if (!id) {
      return Q.reject('请提供记录id').nodeify(callback);
    }
    var path = self.baseUrl;
    path += '/' + id;
    return self.patchByUrl(path, body, callback);
  }

  /**
   * Create a doc by url.
   * @param {string} url
   * @param {Object} body
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  createByUrl(url, body, callback) {
    if (!url) {
      return Q.reject('请提供有效的url').nodeify(callback);
    }
    DataHelper.httpService = this.httpService;
    return DataHelper.post(url, body, callback);
  }

  /**
   * Create a doc by base url.
   *
   * @param {Object} body
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  create(body, callback) {
    var self = this;
    var path = self.baseUrl;
    return self.createByUrl(path, body, callback);
  }

  /**
   * Delete docs by url.
   *
   * @param {string} url
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  deleteByUrl(url, callback) {
    if (!url) {
      return Q.reject('请提供有效的url').nodeify(callback);
    }
    DataHelper.httpService = this.httpService;
    return DataHelper.delete(url, callback);
  }

  /**
   * Delete a doc by id.
   *
   * @param {string} id
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  deleteByid(id, callback) {
    var self = this;
    if (!id) {
      return Q.reject('请提供记录id').nodeify(callback);
    }
    var path = self.baseUrl;
    path += '/' + id;
    return self.deleteByUrl(path, callback);
  }

  /**
   * Get data list
   * @param filter {Object}
   * @param options {Object}
   * @param domain {string} domain name | host name
   * @param callback {function}
   * @returns {Promise}
   */
  getData(filter, options, domain, callback) {
    var self = this;
    if (!filter) {
      filter = {};
    }
    if (!options) {
      options = {};
    }

    if (!domain) {
      domain = 'default';
    }
    var condition = {
      filter: filter,
      options: options,
      domain: domain
    };
    return self.query(condition, callback).nodeify(callback);
  }

  /**
   * Get a doc
   * @param filter {Object}
   * @param options {Object}
   * @param domain {string} domain name | host name
   * @param callback {function}
   * @returns {Promise}
   */
  getOne(filter, options, domain, callback) {
    var self = this;
    return self.getData(filter, options, domain, callback).then(data=> {
      if (!Array.isArray(data) || data.length < 1) {
        return null;
      }
      return data[0];
    }).nodeify(callback);
  }

  /**
   * Get data count
   * @param filter {Object}
   * @param options {Object}
   * @param domain {string} domain name | host name
   * @param callback {function}
   * @returns {Promise}
   */
  getCount(filter, options, domain, callback) {
    var self = this;
    if (!filter) {
      filter = {};
    }
    if (!options) {
      options = {};
    }
    if (!domain) {
      domain = 'default';
    }
    var condition = {
      filter: filter,
      options: options,
      domain: domain
    };
    return self.count(condition, callback).nodeify(callback);
  }

  /**
   * Get data list and count
   * @param filter {Object}
   * @param options {Object}
   * @param domain {string} domain name | host name
   * @param callback {function}
   * @returns {Promise}
   */
  getDataAndCount(filter, options, domain, callback) {
    var self = this;
    if (!filter) {
      filter = {};
    }
    if (!options) {
      options = {};
    }
    if (!domain) {
      domain = 'default';
    }
    var condition = {
      filter: filter,
      options: options,
      domain: domain
    };
    return self.queryDataAndCount(condition, callback).nodeify(callback);
  }

  getOneById(id, domain, callback) {
    var self = this;
    var filter = {
      condition: {_id: id}
    };
    var options = {
      findOne: true
    };

    if (!domain) {
      domain = 'default';
    }

    return self.getData(filter, options, domain, callback).then(data=> {
      if (!Array.isArray(data) || data.length < 1) {
        return null;
      }
      return data[0];
    }).nodeify(callback);
  }

  getOneByCondition(condition, domain, callback) {
    var self = this;
    var filter = {};
    if (!condition.condition) {
      filter.condition = condition;
    }
    else {
      filter = condition;
    }
    if (!filter.limit) {
      filter.limit = 1
    }
    var options = {
      findOne: true
    };
    if (!domain) {
      domain = 'default';
    }

    return self.getData(filter, options, domain, callback).then(data=> {
      if (!Array.isArray(data) || data.length < 1) {
        return null;
      }
      return data[0];
    }).nodeify(callback);
  }

  /**
   * Create docs
   * @param body {Ojbect}
   * @param options {Object}
   * @param domain {string} domain name | host name
   * @param callback {function}
   * @returns {*}
   */
  post(body, options, domain, callback) {
    var self = this;
    if (!options) {
      options = {};
    }
    if (!options.revalType) {
      options.revalType = 'CREATED_OBJECT';
    }
    if (!domain) {
      domain = 'default';
    }
    /*if (options.revalType && options.revalType != 'CREATED_OBJECTS') {
      return Q.reject({errorCode: 406, message: 'revalType 无效'}).nodeify(callback);
    }*/
    var path = self.baseUrl;

    var condition = {
      options: options,
      domain: domain
    };
    path += '?' + qs.stringify(condition);

    return self.createByUrl(path, body, callback).nodeify(callback);
  }

  /**
   * Put docs by condition.
   *
   * @param {Object} filter
   * @param {Object} body
   * @param {Object} options
   * @param domain {string} domain name | host name
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  put(filter, body, options, domain, callback) {
    var self = this;
    if (typeof filter != 'object') {
      return Q.reject({errorCode: 406, message: '更新条件无效'}).nodeify(callback);
    }

    if (!options) {
      options = {};
    }
    if (!options.revalType) {
      options.revalType = 'UPDATED_OBJECT';
    }
   /* if (options.revalType != 'UPDATED_STATUS' && options.revalType != 'UPDATED_OBJECT') {
      return Q.reject({errorCode: 406, message: 'revalType 无效'}).nodeify(callback);
    }*/
    if (!domain) {
      domain = 'default';
    }
    var path = self.baseUrl;

    var condition = {
      filter: filter,
      options: options,
      domain: domain
    };
    path += '?' + qs.stringify(condition);

    return self.putByUrl(path, body, callback).nodeify(callback);
  }

  /**
   * Patch docs by condition.
   *
   * @param {Object} filter
   * @param {Object} body
   * @param {Object} options
   * @param domain {string} domain name | host name
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  patch(filter, body, options, domain, callback) {
    var self = this;
    if (typeof filter != 'object') {
      return Q.reject({errorCode: 406, message: '更新条件无效'}).nodeify(callback);
    }

    if (!options) {
      options = {};
    }
    if (!options.revalType) {
      options.revalType = 'UPDATED_OBJECT';
    }
   /* if (options.revalType != 'UPDATED_STATUS' && options.revalType != 'UPDATED_OBJECT') {
      return Q.reject({errorCode: 406, message: 'revalType 无效'}).nodeify(callback);
    }*/
    if (!domain) {
      domain = 'default';
    }
    var path = self.baseUrl;

    var condition = {
      filter: filter,
      options: options,
      domain: domain
    };
    path += '?' + qs.stringify(condition);

    return self.patchByUrl(path, body, callback).nodeify(callback);
  }

  /**
   * Delete docs by condition.
   *
   * @param {Object} filter
   * @param {Object} options
   * @param domain {string} domain name | host name
   * @param {function} callback
   * @returns {Promise}
   *
   * @memberOf DataHelper
   */
  delete(filter, options, domain, callback) {
    var self = this;
    if (typeof filter != 'object') {
      return Q.reject({errorCode: 406, message: '删除条件无效'}).nodeify(callback);
    }

    if (!options) {
      options = {};
    }
    if (!options.revalType) {
      options.revalType = 'REMOTED_OBJECTS';
    }
   /* if (options.revalType && options.revalType != 'REMOTED_OBJECTS') {
      return Q.reject({errorCode: 406, message: 'revalType 无效'}).nodeify(callback);
    }*/
    if (!domain) {
      domain = 'default';
    }
    var path = self.baseUrl;

    var condition = {
      filter: filter,
      options: options,
      domain: domain
    };
    path += '?' + qs.stringify(condition);
    return self.deleteByUrl(path, callback).nodeify(callback);
  }

  search(pipeline, options, domain, callback) {
    var self = this;
    if (!Array.isArray(pipeline)) {
      return Q.reject({errorCode: 406, message: '聚合条件无效'}).nodeify(callback);
    }
    if (!options) {
      options = {};
    }
    if (!domain) {
      domain = 'default';
    }

    var condition = {
      options: options,
      domain: domain
    };
    return self.aggregate(condition, pipeline, callback).nodeify(callback);
  }
}

module.exports.DataHelper = DataHelper;