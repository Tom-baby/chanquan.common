/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File queueListener
 * @Date 17-3-4
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var Q = require('q');
var logger = require('../logUtil').getLogger('chanquan:common:services:message:queueListener');
var EmitterConfig = require('./emitterConfig');
class QueueListener {
  constructor() {

  }

  selectEmitter(queues, callback) {
    var self = this;
    var method = 'listener';
    try {
      if (!queues || !queues.docs) {
        logger.error(method, 'Queue message invalid', queues);
        return Q.reject({errorCode: 406, message: 'Queue message invalid'});
      }

      if (!Array.isArray(queues.docs)) {
        queues.docs = [queues.docs];
      }

      var promises = [];
      queues.docs.forEach(item=> {
        logger.debug(method, ' Msg-record in Q: ', item);
        var emitter = EmitterConfig.getEmitter(item.msgType);
        if (!emitter) {
          return promises.push(Q.reject(new Error('Missing emitter for message type "' + item.msgType + '"')));
        }

        var options = {
          msgId: item.msgId,
          msgType: item.msgType,
          to: item.target,
          endpoint: item.endpoint
        };
        promises.push(emitter.muteOnTarget(item.target).then(function (mute) {
          if (mute) {
            logger.warn(method, 'Mute is enabled on target "' + item.target + '", so ignore the message emitting');
            return;
          }
          return emitter.send(queues.domain, item.msgRef, options);
        }));
      });

      return Q.allSettled(promises).then(function (results) {
        logger.debug(method, '[Exit]');
        return results;
      }).nodeify(callback);
    } catch (error) {
      logger.error(method, 'Error occurs during post-hook of MsgQPut: ', error);
      return Q.reject(error).nodeify(callback);
    }
  }
}

module.exports = new QueueListener();