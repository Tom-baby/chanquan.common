'use strict'

/**
 * DataSource module
 * The datasource module contains a DataSource interface definition, all of concrete storage type should
 * implement this interface. And also, expose a datasource factory class for datasource creation
 *
 * @author lizh
 */

let Q                     = require('q');
var logger                = require('../services/logUtil').getLogger('chanquan:zk-datasource');
let DataSource            = require('./datasource');
var zookeeper            = require('node-zookeeper-client');


let ZK_DATASOURCE_DRIVER_TYPE = 'zookeeper';

/**
 * Data source implementation for Redis
 *
 * @private
 */
class ZookeeperDataSource extends DataSource {
  constructor (conf) {
    super();
    this._conf = conf;
    this._conn = null;
    this._status = null;
  }

  static getType() {
    return ZK_DATASOURCE_DRIVER_TYPE;
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
    this._status = 'connecting'
    if (! self._conf) {
      logger.error('Invalid zookeeper client conf: ' + self._conf + ', abort to create zookeeper connection');
      return callback(null, null);
    }

    if (self._conn) {
      if (callback) {
        callback(null, self);
      }
      return;
    }

    try {
      logger.info('About to connect to zookeeper [host]: ' + self._conf.host + ', [port]: ' + self._conf.port);

      var client = zookeeper.createClient(self._conf.host + ':' + self._conf.port);

      client.once('connected', function () {
        logger.info('Connected to ZooKeeper.');
      });
      client.once('disconnected', function () {
        logger.info('client disconnected to ZooKeeper.');
        self.close();
        self._conf = null;
      });
      client.connect();
      this._status = 'connected'
      self._conn = client;
      callback(null, self);
    } catch (err) {
      logger.error('Error occurs during creating  zookeeper client due to:', err);
      callback(err);
    }
  }

  close(){
    if(this._conn)
    {
      this._conn.close();
      this._conn = null;
      this._status = 'disconnected'
    }
  }

  createNode(nodePath, data, acls, mode){
    let deferred = Q.defer();
    if(!this._conn || this._status != 'connected'){
      return deferred.reject(new Error("ZooKeeper 服务不可用。"));
    }
    logger.info("to create node %s with data ", nodePath, data);
    this._conn.create(nodePath, data, acls, mode, function (error, path) {
      if (error) {
        logger.error('Error occurred to create node:', error);
        return deferred.reject(error);
      }
      logger.info('Node: %s is created.', path);
      return deferred.resolve(path);
    });
    return deferred.promise;
  }

  removeNode(nodePath, version){
    let deferred = Q.defer();
    if(!this._conn || this._status != 'connected'){
      return deferred.reject(new Error("ZooKeeper 服务不可用。"));
    }
    logger.info("to remove node %s ", nodePath);
    this._conn.remove(nodePath, version,  function (error) {
      if (error) {
        logger.error('Error occurred to remove node:', error);
        return deferred.reject(error);
      }
      logger.info('Node %s is deleted.', nodePath);
      return deferred.resolve();
    });
    return deferred.promise;
  }

  getChildren(nodePath, watcher){
    let deferred = Q.defer();
    if(!this._conn || this._status != 'connected'){
      return deferred.reject(new Error("ZooKeeper 服务不可用。"));
    }
    this._conn.getChildren(nodePath, watcher, function (error, children, stats) {
      if (error) {
        logger.error('Error occurred to get node children:', error);
        return deferred.reject(error);
      }
      logger.debug("get Node %s children ", nodePath, children);
      return deferred.resolve(children);
    });
    return deferred.promise;
  }

  nodeExists(nodePath, watcher){
    let deferred = Q.defer();
    if(!this._conn || this._status != 'connected'){
      return deferred.reject(new Error("ZooKeeper 服务不可用。"));
    }
    this._conn.exists(nodePath, watcher, function (error, stat) {
      if (error) {
        logger.error('Error occurred to check node:', error);
        return deferred.reject(error);
      }

      if (stat) {
        logger.info('Node: %s exists and its version is: %j', nodePath, stat.version);
        return deferred.resolve(true);
      } else {
        logger.info("Node: %s does not exist ", nodePath);
        return deferred.resolve(false);
      }
    });
    return deferred.promise;
  }

  getNodeData(nodePath, watcher){
    let deferred = Q.defer();
    if(!this._conn || this._status != 'connected'){
      return deferred.reject(new Error("ZooKeeper 服务不可用。"));
    }
    this._conn.getData(nodePath, watcher, function (error, data, stat) {
      if (error) {
        logger.error('Error occurred to get node data:', error);
        return deferred.reject(error);
      }
      if(data)
        data = JSON.parse(data.toString('utf8'));
      logger.debug("get Node %s data ", nodePath, data);
      return deferred.resolve(data);
    });
    return deferred.promise;
  }

  setNodeData(nodePath, data){
    let deferred = Q.defer();
    if(!this._conn || this._status != 'connected'){
      return deferred.reject(new Error("ZooKeeper 服务不可用。"));
    }
    logger.debug("set Node: %s data ", nodePath, data ? data : "");
    this._conn.setData(nodePath,  new Buffer(data), function (error, stat) {
      if (error) {
        logger.error('Error occurred to set node data:', error);
        return deferred.reject(error);
      }
      logger.info("set Node <%s> data done ", nodePath);
      return deferred.resolve(stat);
    });
    return deferred.promise;
  }

  isConnected(){
    if(!this._conn || this._status != 'connected'){
      return deferred.reject(new Error("ZooKeeper 服务不可用。"));
    }
    logger.debug("zk conn state: ", this._conn.getState());
    if(this._conn.getState() == "DISCONNECTED")
      return false;
    else
      return true;
  }

  /**
   * Return a redis db client
   *
   * @return {object},redis client connection
   *
   */
  getConnection() {
    return this._conn;
  }
}

module.exports = exports = ZookeeperDataSource;