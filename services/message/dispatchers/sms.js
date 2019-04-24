/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File sms
 * @Date 17-2-13
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var Q = require('q');

var logger = require('../../logUtil').getLogger('chanquan:common:services:message:dispatchers:sms');
var DataHelper = require('../../../services/dataHelper').DataHelper;
var BaseDispatcher = require('./baseDispatcher');
var dispatcherConfig = require('../dispatcherConfig');
var dispatcherNames = dispatcherConfig.dispatcherNames;
var queueListener = require('../queueListener');

class Dispatcher extends BaseDispatcher {

  constructor(templateHome, msgStore, qWriter, dataService) {
    super(templateHome, msgStore, qWriter, dataService);
    this.userData = this.dataService;
  }

  set userData(dataService) {
    var method = 'userData';
    var serviceName = 'user';
    if (!DataHelper.checkDataService(dataService, serviceName)) {
      logger.error(method, '(process exit)', serviceName + ' data service invalid');
      throw new Error(serviceName + ' data service invalid');
    }
    this._userData = dataService[serviceName];
  }

  get userData() {
    return this._userData;
  }

  get NAME() {
    return dispatcherNames.Sms;
  }

  /**
   * Assemble a user message endpoint array
   * @param to
   * @param users <Array> user list
   * @returns {Array}
   * [{
	 *   target: <string>,
	 *   endpointType: <string>,
	 *   address: <string>
	 * }]
   */
  targets(to, users) {
    var targets = [];
    users.forEach(function (user) {
      var mobile = null;
      if (user && user.mobile) {
        mobile = user.mobile;
      }
      targets.push(new BaseDispatcher.Target(to, 'sms', mobile));
    });
    return targets;
  }

  /**
   * get a sms info by id and assemble a target array object
   * @param to    <string>
   * @param msgType   <string>
   * @param options
   * @returns {promise}
   * [{
	 *   target: <string>,
	 *   endpointType: <string>,
	 *   address: <string>
	 * }]
   */
  getTarget(to, msgType, options) {
    var self = this;
    var domain = options && options.domain;
    return self.userData.getOneById(to.toString(), domain).then(function (user) {
      logger.debug('Get user: ', user);
      return self.targets(to, user);
    }).fail(function (error) {
      logger.error('Error to get user by user id: ', to, ', due to', error);
      logger.error(self.getClassName(), 'getWechatTarget', '[Exit](failed)');
      throw error;
    });
  }

  /**
   * order distribution send a message to target
   * @param to
   * @param msgType
   * @param options <object>
   * [{
	 *   target: <string>,
	 *   endpointType: <string>,
	 *   address: <string>
	 * }]
   */
  settleTargets(to, msgType, options) {
    if (!options || !options.docs) {
      return this.getTarget(to, msgType, options);
    }

    //options is a device array object
    var defer = Q.defer();
    try {
      if (!Array.isArray(options.docs)) {
        options.docs = [options.docs];
      }
      defer.resolve(this.targets(to, options.docs));
    } catch (err) {
      defer.reject(err);
    }
    return defer.promise;
  }

  static init(templateHome, msgStore, qWriter, dataService) {
    var dispatcher = new Dispatcher(templateHome, msgStore, qWriter, dataService);
    dispatcher.on(Dispatcher.putToQ_event, queueListener.selectEmitter.bind(this));
    dispatcherConfig.mgrt.set(dispatcher.NAME, dispatcher);
  }
}

module.exports = Dispatcher;
