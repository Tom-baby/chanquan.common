/*
 *  ZkClientProxy is a proxy of zookeeper client
 */

'use strict'
var logger                = require('./logUtil').getLogger('chanquan:service:zkClientProxy');
let ZookeeperDS          = require('../datasource/zookeeperDS');

let Q                    = require('q');
let process              = require('process');
let schedule             = require('node-schedule');

class ZkClientProxy {

  constructor(zkCfg){
    this.zkDS = null;
    this.zkCfg = zkCfg;
    this.initWatcherList = new Map();

    process.on('exit', (code) => {
      logger.info('About to exit with code: %s', code);
      if(this.zkDS)
        this.zkDS.close();
    });
  }


  init(){
    let deferred = Q.defer();
    this.zkDS = new ZookeeperDS(this.zkCfg);
    this.zkDS.init(function(error, inst){
      if(error){
        logger.error("error occurred when init zk client.", error);
        this.zkDS = null;
        return deferred.reject(error);
      }
      return deferred.resolve();
    });
    return deferred.promise;
  }

  startPing(){
    var sessionTimeout = this.zkDS.getConnection().getSessionTimeout();
    if(sessionTimeout)
      sessionTimeout = sessionTimeout / 3000;
    else
      sessionTimeout = 10;

    if(sessionTimeout > 60 )
      sessionTimeout = 59;

    let _self = this;
    schedule.scheduleJob('*/' + sessionTimeout + ' * * * * *', function(){
      //logger.debug("ping zk server %", this.zkCfg);
      _self.nodeExists("/").fail(error => {
        if(error.name == 'CONNECTION_LOSS' || !_self.zkDS || !_self.zkDS.isConnected()){
          _self.reConnect();
        }
      });
    });
  }

  reConnect(){
    try{
      if(this.zkDS)
        this.zkDS.close();
      let _self = this;
      this.init().then(ds => {
        this.initWatcherList.forEach(function (item, key, mapObj) {
          _self.getNodeData(key, item);
        });
      }).fail(error => {
        logger.error("init error occurred.", error);
      });
    }catch (error){
      logger.error("reconnect error occurred.", error);
    }
  }

  setInitWatcher(nodePath, watcher){
    this.initWatcherList.set(nodePath, watcher);
  }

  createNode(nodePath, data, acls, mode){
    return this.zkDS.createNode(nodePath, data, acls, mode);
  }

  removeNode(nodePath, version){
    return this.zkDS.removeNode(nodePath, version);
  }

  getChildren(nodePath, data){
    return this.zkDS.getChildren(nodePath, data);
  }

  nodeExists(nodePath, watcher){
    return this.zkDS.nodeExists(nodePath, watcher);
  }

  getNodeData(nodePath, watcher){
    return this.zkDS.getNodeData(nodePath, watcher);
  }

  setNodeData(nodePath, data){
    return this.zkDS.setNodeData(nodePath, data);
  }

  isConnected(){
    return this.zkDS.isConnected();
  }

  close(){
    this.zkDS.close();
  }
}

module.exports = exports = ZkClientProxy;