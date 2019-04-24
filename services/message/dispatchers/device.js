/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File device
 * @Date 17-2-13
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var Q = require('q');

var BaseDispatcher = require('./baseDispatcher');
var dispatcherConfig = require('../dispatcherConfig');
var dispatcherNames = dispatcherConfig.dispatcherNames;

class Dispatcher extends BaseDispatcher {

  constructor(templateHome, msgStore, qWriter) {
    super(templateHome, qWriter, msgStore);
  }

  get NAME() {
    return dispatcherNames.Device;
  }

  /**
   * order distribution send a message to target
   * @param to
   * @param msgType
   * @param callback  <promise>
   * [{
	 *   target: <string>,
	 *   endpointType: <string>,
	 *   address: <string>
	 * }]
   */
  settleTargets(to, msgType, options) {
    if (!options || typeof options == 'function') {
      return this.getDeviceTarget(to, msgType, options);
    }

    //options is a device array object
    var defer = Q.defer();
    try {
      if (!Array.isArray(options)) {
        options = [options];
      }
      defer.resolve(this.deviceTargets(to, options));
    } catch (err) {
      defer.reject(err);
    }
    return defer.promise;
  }
}

module.exports = Dispatcher;