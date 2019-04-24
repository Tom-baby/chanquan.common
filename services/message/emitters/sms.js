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

var logger = require('../../logUtil').getLogger('chanquan:common:services:message:emitters:sms');
var Q = require('q');
var agent = require('superagent');
var BaseEmitter = require("./baseEmitter");
var EmitterConfig = require('../emitterConfig');
var emitterTypes = EmitterConfig.emitterTypes;
var Sms = require('../sms');

class Emitter extends BaseEmitter {
  constructor(msgStoreData) {
    super(msgStoreData);
  }

  get TYPE() {
    return emitterTypes.Sms_Text;
  }

  send(domain, msgRef, options, callback) {
    var self = this;
    var method = 'send';
    try {
      if (!options || !options.endpoint || !options.endpoint.address) {
        logger.error(method, 'Not exists endpoint address', options);
        return Q.reject({errorCode: 406, message: 'Not exists endpoint address'}).nodeify(callback);
      }
      return self.getPayload(domain, msgRef).then(function (ref) {
        logger.debug(method, 'getPayload', ref);
        if (!ref) {
          logger.error(method, 'ref invalid', ref);
          return Q.reject({errorCode: 406, message: 'ref invalid'}).nodeify(callback);
        }
        if (!ref.payload) {
          logger.error(method, 'payload invalid', ref.payload);
          return Q.reject({errorCode: 406, message: 'payload invalid'}).nodeify(callback);
        }
        return Sms.sendSms(options.endpoint.address, ref.payload).then(data=> {
          //TODO, message emitter status write back to message-ref record, e.g: emitted, read, not read, etc
          logger.debug(method, 'send sms succeed', data);
          return data;
        }).fail(error=> {
          logger.error(method, 'send sms failed', error);
          return Q.reject(error);
        });
      }).nodeify(callback);
    } catch (error) {
      logger.error(method, '[Exit](failed)', error);
      return Q.reject(error).nodeify(callback);
    }
  }

  static init(msgStoreData) {
    var emitter = new Emitter(msgStoreData);
    EmitterConfig.mgrt.set(emitter.TYPE, emitter);
  }
}

module.exports = Emitter;
