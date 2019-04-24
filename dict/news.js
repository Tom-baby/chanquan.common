/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File news
 * @Date 17-1-4
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var BaseDict = require('./baseDict');

class NewsDict extends BaseDict {
  constructor(details) {
    super(details);
  }

  static get status_detail() {
    return {
      name: 'status',
      de: {
        'CREATED': {
          name: 'created',
          display: '新添加'
        },
        'REQUESTED': {
          name: 'requested',
          display: '申请审核'
        },
        'APPROVED': {
          name: 'approved',
          display: '已审核'
        },
        'PUBLISHED': {
          name: 'published',
          display: '已发布'
        },
        'WITHDRAWED': {
          name: 'withdrawed',
          display: '已撤回'
        },
        'REJECTED': {
          name: 'rejected',
          display: '审核未通过'
        },
        'DELETED': {
          name: 'deleted',
          display: '已删除'
        }
      }
    }
  }

  static init() {
    this.dict = new NewsDict(details);
  }
}

var details = [NewsDict.status_detail];

module.exports = NewsDict;