/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File index
 * @Date 17-2-14
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var Dispatchers = require('./dispatchers');
Object.assign(module.exports, Dispatchers);

var Emitters = require('./emitters');
Object.assign(module.exports, Emitters);

var DispatcherConfig = require('./dispatcherConfig');
var MessageAssembler = require('./messageAssembler');
var EmitterConfig = require('./emitterConfig');
var Sms = require('./sms');

module.exports.DispatcherConfig = DispatcherConfig;
module.exports.MessageAssembler = MessageAssembler;
module.exports.EmitterConfig = EmitterConfig;
module.exports.Sms = Sms;