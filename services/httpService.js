/**
 * Created by zhuxijun on 16-6-2.
 */

'use strict';

var logger  = require('./logUtil').getLogger('chanquan:common:services:httpService');
var Q = require('q');
var http = require('http');
var agent = require('superagent');

class HttpService {
  /**
   * DataService constructor
   * @param options {{basicAuth: string, serverAddress: string}}
   */
  constructor(options) {
    this.basicAuth = options;
    this.serverAddress = options;
    this.platform_name = options;
    this.platform = options;
  }

  static get DEFAULT_PLATFORM_NAME() {
    return 'platform';
  }

  static get GET_NAME() {
    return 'get';
  }

  static get POST_NAME() {
    return 'post';
  }

  static get PUT_NAME() {
    return 'put';
  }

  static get PATCH_NAME() {
    return 'patch';
  }

  static get DELETE_NAME() {
    return 'delete';
  }

  static get SEARCH_NAME() {
    return 'search';
  }

  get basicAuth() {
    return this._basicAuth;
  }

  set basicAuth(options) {
    if (!options || !options.basicAuth) {
      throw {
        errorCode: 500,
        message: 'Invalid options basicAuth:' + JSON.stringify(options)
      };
    }

    this._basicAuth = options.basicAuth;
  }

  get serverAddress() {
    return this._serverAddress;
  }

  set serverAddress(options) {
    if (typeof options != 'object') {
      throw {
        errorCode: 500,
        message: 'Invalid options type:' + (typeof options)
      };
    }
    if (options.serverAddress) {
      this._serverAddress = options.serverAddress;
    }
    else if (options.host) {
      this._serverAddress = 'http://' + options.host;
      if (options.port) {
        this._serverAddress += ':' + options.port;
      }
      if (options.version) {
        this._serverAddress += '/' + options.version;
      }
    }
    else {
      throw {
        errorCode: 500,
        message: 'Invalid options object:' + JSON.stringify(options)
      };
    }
  }

  set platform_name(options) {
    if (options && options.platform_name) {
      this._platform_name = options.platform_name;
    }
  }

  get platform_name() {
    return this._platform_name || HttpService.DEFAULT_PLATFORM_NAME;
  }

  set platform(options) {
    if (options && options.platform) {
      this._platform = options.platform;
    }
  }

  get platform() {
    return this._platform || null;
  }

  /**
   * Send a request and return the result by agent
   * @param verb {string} request method
   * @param path {string} e.x--> /applications | /orders
   * @param payload {object} body
   * @returns {promise}
   * @public
   */
  execute(verb, path, payload) {
    var self = this;
    var method = 'execute';

    var defer = Q.defer();
    var request = self.init(verb, path, payload);

    request.end(function (err, res) {
      if (err) {
        logger.error(method + ' Failed to execute the data service.', err);
        defer.reject(err);
      } else {
        defer.resolve(res);
      }
    });
    return defer.promise;
  }

  /**
   * Init a request object when send a request
   * @param verb {string} request method
   * @param path {string} e.x--> /applications | /orders
   * @param payload {object} body
   * @returns {promise}
   * @private
   */
  init(verb, path, payload) {
    var url = this.serverAddress + path;

    if (!verb) verb = HttpService.GET_NAME;
    verb = verb.trim().toLowerCase();

    var request;
    switch (verb) {
      case HttpService.GET_NAME:
        request = agent.get(url);
        break;
      case HttpService.POST_NAME:
        request = agent.post(url);
        break;
      case HttpService.PUT_NAME:
        request = agent.put(url);
        break;
      case HttpService.DELETE_NAME:
        request = agent.del(url);
        break;
      case HttpService.PATCH_NAME:
        request = agent.patch(url);
        break;
      case HttpService.SEARCH_NAME:
        request = agent.search(url);
        break;
      default:
        request = agent.get(url);
        break;
    }

    request.set('Content-Type', 'application/json');
    request.set('Authorization', this.basicAuth);
    if (this.platform) {
      request.set(this.platform_name, this.platform);
    }

    if (verb === HttpService.POST_NAME || verb === HttpService.PUT_NAME || verb === HttpService.PATCH_NAME || verb === HttpService.SEARCH_NAME) {
      request.send(JSON.stringify(payload));
    }

    return request;
  }

  /**
   * Send a post request by agent
   * @param path {string} e.x--> /applications | /orders
   * @param payload {object} body
   * @param userId {string} user id
   * @returns {promise}
   * @public
   */
  post(path, payload) {
    return this.execute(HttpService.POST_NAME, path, payload);
  }

  /**
   * Send a get request by agent
   * @param path {string} e.x--> /applications | /orders
   * @param payload {object} body
   * @returns {promise}
   * @public
   */
  get(path, payload) {
    return this.execute(HttpService.GET_NAME, path, payload);
  }

  /**
   * Send a put request by agent
   * @param path {string} e.x--> /applications | /orders
   * @param payload {object} body
   * @returns {promise}
   */
  put(path, payload) {
    return this.execute(HttpService.PUT_NAME, path, payload);
  }

  /**
   * Send a patch request by agent
   * @param path {string} e.x--> /applications | /orders
   * @param payload {object} body
   * @returns {promise}
   * @public
   */
  patch(path, payload) {
    return this.execute(HttpService.PATCH_NAME, path, payload);
  }

  /**
   * Send a delete request by agent
   * @param path {string} e.x--> /applications | /orders
   * @param payload {object} body
   * @returns {promise}
   * @public
   */
  delete(path, payload) {
    return this.execute(HttpService.DELETE_NAME, path, payload);
  }

  /**
   * Send a search request by agent
   * @param path {string} e.x--> /applications | /orders
   * @param payload {object} body
   * @returns {promise}
   * @public
   */
  search(path, payload) {
    return this.execute(HttpService.SEARCH_NAME, path, payload);
  }
}

module.exports = HttpService;
