/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File sms
 * @Date 17-2-14
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var logger = require('../logUtil').getLogger('chanquan:common:services:message:sms');
var agent = require('superagent');
var Q = require('q');
var xml2js = require('xml2js');
var qs = require('qs');


var EmitterConfig = require('./emitterConfig');

class Sms {
	constructor(mobile, content) {
		return Sms.sendSms(mobile, content);
	}

	static get defaultConfig() {
		return EmitterConfig.smsConfig;
	}

	static messageUrl(conf) {
		conf = conf || Sms.defaultConfig;
		if (conf && conf.url)
		return conf.url;
		return null;
	}

	static getBody(mobile, content, conf) {
		var method = 'getBody';
		conf = conf || Sms.defaultConfig;
		var body = null;
		if (!EmitterConfig.checkSmsConfig(conf)) {
			throw {errorCode: 406, message: 'sms 配置无效'};
		}

		if (conf && conf.smsConfig) {
			var accountKey = conf.smsConfig.account;
			var passwordKey = conf.smsConfig.password;
			var mobileKey = conf.smsConfig.mobile;
			var contentKey = conf.smsConfig.content;
			body = {};
			if (accountKey)
			body[accountKey] = conf.account;
			if (passwordKey)
			body[passwordKey] = conf.password;
			if (mobileKey)
			body[mobileKey] = mobile;

			if (contentKey  )
				body[contentKey] = content;

			// if (contentKey && conf.smsPlatform =="chuangMing" ){
			// 	body[contentKey] = encodeURI(content);//URL字符标准化转码
			// }else{
			// 	body[contentKey] = content;
			// }
			if(conf.action)
				body.action = conf.action
			if(conf.cgid)
				body.cgid = conf.cgid
		} else {
			body = {
				action: 'send',
				userid: conf.userid,
				account: conf.account,
				password: conf.password,
				mobile: mobile,
				content: content
			};
		}

		logger.debug(method, 'body:', body);
		return body;
	}

	static sendSms(mobile, content) {
		var self = this;
		var method = 'sendSMS';
		var defer = Q.defer();
		try {
			logger.debug(method, 'Entry', mobile, content);
			if (!mobile || mobile === '') {
				defer.reject('手机号码缺失');
				return defer.promise;
			}

			if (!content || content === '') {
				defer.reject('营销短信内容缺失');
				return defer.promise;
			}

			var body = self.getBody(mobile, content);
			var smsUrl = Sms.messageUrl();

			agent
				.post(smsUrl)
				.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')
				.send(body)
				.end(function (err, res) {
					if (err) {
						logger.error(method, smsUrl, err);
					} else {
						logger.debug(method, smsUrl, res.text);

						if(res.text && res.text.indexOf('name="sendOnce"')>0){//名创短信平台(天津)
							xml2js.parseString(res.text, {explicitArray: false, ignoreAttrs: false}, function (err, result) {
								if (err) {
									return defer.reject(err);
								}
								if(!result.xml || !result.xml['$'] || !result.xml['$'].result == 1){
									return defer.reject('No decrypted data found');
								}

								return defer.resolve(result);
							})
						}else{
							xml2js.parseString(res.text, {explicitArray: false, ignoreAttrs: true}, function (err, result) {
								if (err) {
									return defer.reject(err);
								}
								if (!result || !result.returnsms) {
									return defer.reject('No decrypted data found');
								}
								return defer.resolve(result.returnsms);
							});
						}
					}
				});
			return defer.promise;
		}
		catch (error) {
			logger.error(method, '[Error]', error);
			return Q.reject(error);
		}
	}
}

module.exports = Sms;