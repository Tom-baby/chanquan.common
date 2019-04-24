/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File index
 * @Date 17-1-4
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var debug = require('debug')('chanquan.common:dict:index');

var BidDict = require('./bid');
var ProjectDict = require('./project');
var NewsDict = require('./news');
var MortgageDict = require('./mortgage');
var TenderDict = require('./tender');

module.exports = {
  BidDict: BidDict,
  ProjectDict: ProjectDict,
  NewsDict: NewsDict,
  MortgageDict: MortgageDict,
  TenderDict: TenderDict
};
