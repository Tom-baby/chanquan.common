/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File tender
 * @Date 17-4-11
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var BaseDict = require('./baseDict');

class Dict extends BaseDict {
  constructor(details) {
    super(details);
  }

  /**
   * 招标项目状态
   * @returns {{name: string, de: {CREATED: {name: string, display: string}, REQUESTED: {name: string, display: string}, APPROVED: {name: string, display: string}, PUBLISHED: {name: string, display: string}, WITHDRAWED: {name: string, display: string}, REJECTED: {name: string, display: string}, DELETED: {name: string, display: string}, DEALED: {name: string, display: string}}}}
   */
  static get status_detail() {
    return {
      name: 'status',
      de: {
        CREATED: {
          name: 'created',
          display: '新添加的申请记录'
        },
        REQUESTED: {
          name: 'requested',
          display: '申请审核'
        },
        APPROVED: {
          name: 'approved',
          display: '已审核'
        },
        PUBLISHED: {
          name: 'published',
          display: '已发布'
        },
        WITHDRAWED: {
          name: 'withdrawed',
          display: '已撤回'
        },
        REJECTED: {
          name: 'rejected',
          display: '已驳回'
        },
        DELETED: {
          name: 'deleted',
          display: '已删除'
        },
        DEALED: {
          name: 'dealed',
          display: '已成交'
        }
      }
    }
  }

  /**
   * 行业类别
   * @returns {{name: string, de: {BUILD: {name: string, display: string}, PURCHASE: {name: string, display: string}, LAND: {name: string, display: string}, GENERAL: {name: string, display: string}}}}
   */
  static get bidder_industryCategory_detail() {
    return {
      name: 'industryCategory',
      de: {
        BUILD: {
          name: 'build',
          display: '建设工程'
        },
        PURCHASE: {
          name: 'purchase',
          display: '政府采购'
        },
        LAND: {
          name: 'land',
          display: '国土资源'
        },
        GENERAL: {
          name: 'general',
          display: '综合'
        }
      }
    }
  }

  static init() {
    this.dict = new Dict(details);
  }
}

var details = [Dict.status_detail,
  Dict.bidder_industryCategory_detail];

module.exports = Dict;