/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File messageAssembler
 * @Date 17-2-13
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var uid = require('uid-safe');
var DispatcherConfig = require('./dispatcherConfig');
var dispatcherNames = DispatcherConfig.dispatcherNames;
var EmitterConfig = require('./emitterConfig');
var emitterTypes = EmitterConfig.emitterTypes;

class DispatchHeaders {
  constructor(msgId, from, to, msgType, QoS) {
    this.msgId = msgId;
    this.from = from;
    this.to = to;
    this.msgType = msgType;
    this.QoS = QoS || 0;
  }
}

class DispatchDataHolder {
  constructor(templateId, replacement) {
    this.templateId = templateId;
    this.replacement = replacement;
  }
}

class DispatchData {
  constructor(headers, dataHolder) {
    this.headers = headers;
    this.dataHolder = dataHolder;
  }
}

class MessageAssembler {
  constructor() {

  }

  base(dispatcherName, from, to, msgtype, templateName, replacement, options) {
    var dispatcher = DispatcherConfig.getDisptcher(dispatcherName);
    return dispatcher.dispatch(
      new DispatchData(
        new DispatchHeaders(
          uid.sync(18),
          from,
          to,
          msgtype
        ), new DispatchDataHolder(
          templateName,
          replacement
        )
      ),
      options
    )
  }

  /**
   * The default message assembler for sms
   * @param domain {string}
   * @param messageFrom {string} message sender (a platform module or a user...)
   * @param to {string} message receiver {a user or a group ...}
   * @param replacement {object|string} the message content for template
   * @param docs {Array|Object|} a object for message queue endpoint ex:[{mobile:<number>}]
   * @returns {*}
   */
  default_sms(domain, messageFrom, to, replacement, docs) {
    var self = this;
    return self.base(
      dispatcherNames.Sms,
      messageFrom,
      to,
      emitterTypes.Sms_Text,
      null,
      replacement, {
        docs: docs,
        domain: domain
      }
    );
  }
}

module.exports = MessageAssembler;