/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File bid
 * @Date 17-1-4
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var BaseDict = require('./baseDict');

class BidDict extends BaseDict {
  constructor(details) {
    super(details);
  }

  static get status_detail() {
    return {
      name: 'status',
      de: {
        TRADED: {
          name: 'traded',
          display: '成交'
        },
        DELETED: {
          name: 'deleted',
          display: '已删除'
        }
      }
    }
  }

  static init() {
    this.dict = new BidDict(details);
  }
}

var details = [BidDict.status_detail];

module.exports = BidDict;