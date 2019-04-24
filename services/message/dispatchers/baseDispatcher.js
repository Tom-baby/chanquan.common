/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File baseDispatcher
 * @Date 17-2-13
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var Q = require('q');
var CommonDispatcher = require('./../commonDispatcher');
var DataHelper = require('../../../services/dataHelper').DataHelper;
var logger = require('../../logUtil').getLogger('chanquan:common:services:message:dispatchers:baseDispatcher');

class Target {
  constructor(target, endpointType, address) {
    this.target = target;
    this.endpointType = endpointType;
    this.address = address;
  }
}

/**
 * add a wechat message dispatcher for order distribution, the message send to order user
 */
class BaseDispatcher extends CommonDispatcher {

  constructor(templateHome, msgStore, qWriter, dataService) {
    super(templateHome, msgStore, qWriter);
    this.dataService = dataService;
  }

  static get Target() {
    return Target;
  }

  set dataService(dataService) {
    if (!DataHelper.checkDataService(dataService)) {
      logger.warn(method, '(process exit)', 'data service invalid');
      throw new Error('data service invalid');
    }
    this._dataService = dataService;
  }

  get dataService() {
    return this._dataService;
  }

  get NAME() {
    return 'BASE_DISPATCHER';
  }

  getClassName() {
    return 'BaseDispatcher';
  }

  /**
   * Assemble a user message endpoint array
   * @param to
   * @param user <Array> user list
   * @returns {Array}
   * [{
	 *   target: <string>,
	 *   endpointType: <string>,
	 *   address: <string>
	 * }]
   */
  wechatTargets(to, users) {
    var targets = [];
    var openid = '';
    users.forEach(function (user) {
      if (user && user.wechat && user.wechat.openid) {
        openid = user.wechat.openid;
      }
      targets.push(new Target(to, 'wechat', openid));
    });
    return targets;
  }

  /**
   * get a user info by id and assemble a target array object
   * @param to
   * @param msgType
   * @param callback
   * @returns {promise}
   * [{
	 *   target: <string>,
	 *   endpointType: <string>,
	 *   address: <string>
	 * }]
   */
  getWechatTarget(to, msgType, callback) {
    var self = this;
    return self.dataService.findUserById(to.toString()).then(function (user) {
      logger.debug('Get user: ', user);
      return self.wechatTargets(to, user);
    }).fail(function (error) {
      logger.error('Error to get user by user id: ', to, ', due to', error);
      logger.error(self.getClassName(), 'getWechatTarget', '[Exit](failed)');
      throw error;
    }).nodeify(callback);
  }

  /**
   * Assemble a device message endpoint array
   * @param to <string> user id
   * @param devices <Array> item is device object,contain device Id
   * @returns <Array>
   * [{
	 *   target: <string>,
	 *   endpointType: <string>,
	 *   address: <string>
	 * }]
   */
  deviceTargets(to, devices) {
    var targets = [];
    if (devices) {
      devices.forEach(function (device) {
        var deviceId = '';
        if (device.device) {
          deviceId = device.device;
        }
        var endpointType = '';
        if (device.type) {
          if (device.type == 'android') {
            endpointType = 'device:android';
          }
          else {
            endpointType = 'device:ios';
          }
        }
        targets.push(new Target(to, endpointType, deviceId))
      });
    }
    return targets;
  }

  /**
   * get a device info by id and assemble a target array object
   * @param to    <string>
   * @param msgType   <string>
   * @param callback
   * @returns {promise}
   * [{
	 *   target: <string>,
	 *   endpointType: <string>,
	 *   address: <string>
	 * }]
   */
  getDeviceTarget(to, msgType, callback) {
    var self = this;
    return self.dataService.getActivedDevice({user: to.toString()}).then(function (devices) {
      logger.debug('Get devices: ', devices);
      return self.deviceTargets(to, devices);
    }).fail(function (error) {
      logger.error('Error to get user by user id: ', to, ', due to', error);
      logger.error(self.getClassName(), 'getDeviceTarget', '[Exit](failed)');
      throw error;
    }).nodeify(callback);
  }

  getSystemTarget(to, msgType, callback) {
    var defer = Q.defer();
    defer.resolve([new Target(to, 'system', '')]);
    return defer.promise.nodeify(callback);
  }

  /**
   * order distribution send a message to target
   * @param to
   * @param msgType
   * @param options  <object>
   * [{
	 *   target: <string>,
	 *   endpointType: <string>,
	 *   address: <string>
	 * }]
   */
  /*settleTargets(to, msgType, options) {

   }*/
}

module.exports = BaseDispatcher;
