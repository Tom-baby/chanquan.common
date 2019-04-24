/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File dispatcherConfig
 * @Date 17-2-13
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var logger = require('../logUtil').getLogger('chanquan:common:services:message:dispatcherConfig');
var SvcMgrt = require('../svcMgrt');
var MapMgrt = SvcMgrt.MapMgrt;

class DispatcherConfig {
  constructor() {

  }

  static set mgrt_name(mgrt_name) {
    this._mgrt_name = mgrt_name;
  }

  static get mgrt_name() {
    return this._mgrt_name || 'chanquan_message_dispatchers';
  }

  static get dispatcherNames() {
    return this._dispatcherNames || {
        Wechat: 'Wechat',
        Device: 'Device',
        System: 'System',
        Sms: 'Sms'
      }
  }

  static get messageTypes() {
    return {
      Wechat_Template: 'Wechat:Template',
      Wechat_Text: 'Wechat:Text',
      Device_Text: 'Device:Text',
      Nonghe_Internal: 'Nonghe:Internal',
      Sms_Text: 'Sms:Text'
    };
  }

  static set mgrt(dispatchersMgrt) {
    return this._mgrt = dispatchersMgrt;
  }

  static get mgrt() {
    if (!this._mgrt) {
      this.init();
    }
    return this._mgrt;
  }

  static set dispatcherNames(dispatcherNames) {
    return this._dispatcherNames = dispatcherNames;
  }

  static init(mgrt_name) {
    this.mgrt_name = mgrt_name || this.mgrt_name;
    this.mgrt = MapMgrt.CREATE_MAP(this.mgrt_name);
  }

  static getDisptcher(dispatcherName) {
    var method = 'getDisptcher';
    if (typeof dispatcherName != 'string' || !DispatcherConfig.dispatcherNames[dispatcherName]) {
      var message = 'The dispatcher name does not exist';
      logger.error(method, message, dispatcherName);
      throw {errorCode: 406, message: message};
    }

    var dispatcher = this.mgrt.get(dispatcherName);
    if (!dispatcher) {
      var message = 'The dispatcher ' + dispatcherName + ' does not exist or is not initialized';
      logger.error(method, message, dispatcherName);
      throw {errorCode: 406, message: message};
    }

    return dispatcher;
  }
}

module.exports = DispatcherConfig;
