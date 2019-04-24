/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File emitterConfig
 * @Date 17-2-13
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var logger = require('../logUtil').getLogger('chanquan:common:services:message:emitterConfig');
var MD5 = require('crypto-js/md5');
var SvcMgrt = require('../svcMgrt');
var MapMgrt = SvcMgrt.MapMgrt;

class EmitterConfig {
  constructor() {

  }

  static set mgrt_name(mgrt_name) {
    this._mgrt_name = mgrt_name;
  }

  static get mgrt_name() {
    return this._mgrt_name || 'chanquan_message_emitters';
  }

  static get emitterNames() {
    return {
      Wechat: 'Wechat',
      Device: 'Device',
      System: 'System',
      Sms: 'Sms'
    }
  }

  static get emitterTypes() {
    return {
      Sms_Text: 'Sms:Text'
    }
  }

  static set mgrt(dispatchersMgrt) {
    return this._mgrt = dispatchersMgrt;
  }

  static get mgrt() {
    if (!this._mgrt) {
      logger.error('getMgrt', '[Exit](failed)', 'Not initialized emitter config');
      throw {errorCode: 406, message: 'Not initialized emitter config'};
    }
    return this._mgrt;
  }

  static checkSmsConfig(conf) {
    if (conf && typeof conf.url == 'string'
      && typeof conf.userid == 'string'
      && typeof conf.account == 'string'
      && typeof conf.password == 'string') {
      return true;
    }
    return false;
  }

  static init(conf, mgrt_name) {
    var method = 'init';
    this.mgrt_name = mgrt_name || this.mgrt_name;
    this.mgrt = MapMgrt.CREATE_MAP(this.mgrt_name);
    if (typeof conf == 'object') {
      var smsConfig = conf[EmitterConfig.emitterNames.Sms];
      if (!this.checkSmsConfig(smsConfig)) {
        logger.error(method, '(failed)', 'Sms configuration information incomplete!', smsConfig);
      }
      else {

        var newconf = {
          "url": smsConfig.url,
          "userid": smsConfig.userid,
          "account": smsConfig.account,
          "password": smsConfig.password,
          "passwordEncryptionMode": smsConfig.passwordEncryptionMode
        };
        if(smsConfig.smsConfig){//有字段替换的配置
          newconf.smsConfig = smsConfig.smsConfig
          if(smsConfig.action){
            newconf.action = smsConfig.action;
          }
          if(smsConfig.smsPlatform){
            newconf.smsPlatform = smsConfig.smsPlatform; //短信平台
          }
          if(smsConfig.cgid){
            newconf.cgid = smsConfig.cgid; //短信平台
          }
        }else{
          //默认短信配置的加密
          if (newconf.password && typeof newconf.passwordEncryptionMode == 'string' && newconf.passwordEncryptionMode.toLowerCase() == 'md5') {
            newconf.password = MD5(newconf.password).toString().toUpperCase();
            delete newconf.passwordEncryptionMode;
          }
        }

        this.mgrt.set(EmitterConfig.emitterNames.Sms, newconf);
        logger.debug(method, 'Sms configuration complete', this.smsConfig);
      }
    }
  }

  static get smsConfig() {
    return this.mgrt.get(EmitterConfig.emitterNames.Sms);
  }

  static getEmitter(emitterType) {
    var method = 'getEmitter';
    if (typeof emitterType != 'string') {
      var message = 'The emitter type invalid';
      logger.error(method, message, emitterType);
      throw {errorCode: 406, message: message};
    }

    var emitter = this.mgrt.get(emitterType);
    if (!emitter) {
      var message = 'The emitter ' + emitterType + ' does not exist or is not initialized';
      logger.error(method, message, emitterType);
      throw {errorCode: 406, message: message};
    }

    return emitter;
  }
}

module.exports = EmitterConfig;