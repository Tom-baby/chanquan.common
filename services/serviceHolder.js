'use strict'

var logger  = require('./logUtil').getLogger('chanquan:common:services:serviceHolder');

class ServiceHolder {

  constructor() {
    this.serviceMap = new Map();
  }

  registerService(srvName, srvInstance){
    this.serviceMap.set(srvName, srvInstance);
    logger.info("service %s added", srvName );
  }

  removeService(srvName){
    this.serviceMap.delete(srvName);
    logger.info("service %s removed", srvName );
  }

  getService(srvName){
    return this.serviceMap.get(srvName);
  }

}

let serviceHolder = new ServiceHolder();
module.exports = exports = serviceHolder;