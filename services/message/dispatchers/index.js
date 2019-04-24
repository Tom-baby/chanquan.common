/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File index
 * @Date 17-3-4
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var WechatDispatcher = require('./wechat');
var DeviceDispatcher = require('./device');
var SystemDispatcher = require('./system');
var SmsDispatcher = require('./sms');

module.exports.WechatDispatcher = WechatDispatcher;
module.exports.DeviceDispatcher = DeviceDispatcher;
module.exports.SystemDispatcher = SystemDispatcher;
module.exports.SmsDispatcher = SmsDispatcher;