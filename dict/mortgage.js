/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File mortgage
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
   * 抵押贷款状态
   * @returns {{name: string, de: {CREATED: {name: string, display: string}, SUBMIT: {name: string, display: string}, APPROVE: {name: string, display: string}, APPROVED_L2: {name: string, display: string}, REJECTED: {name: string, display: string}}}}
   */
  static get status_detail() {
    return {
      name: 'status',
      de: {
        CREATED: {
          name: 'created',
          display: '新添加的申请记录'
        },
        SUBMITTED: {
          name: 'submitted',
          display: '提交审核'
        },
        APPROVED: {
          name: 'approved',
          display: '已审核'
        },
        REJECTED: {
          name: 'rejected',
          display: '已驳回'
        },
        closed: {
          name: 'closed',
          display: '已关闭'
        },
        completed: {
          name: 'completed',
          display: '已完成'
        }
      }
    }
  }

  /**
   * 性别
   * @returns {{name: string, de: {0: {name: number, display: string}, 1: {name: number, display: string}, 2: {name: number, display: string}}}}
   */
  static get applicant_gender_detail() {
    return {
      name: 'applicant..gender',
      de: {
        0: {
          name: 0,
          display: '未知'
        },
        1: {
          name: 1,
          display: '男'
        },
        2: {
          name: 2,
          display: '女'
        }
      }
    }
  }

  /**
   * 证件类型
   * @returns {{name: string, de: {IDENTITY_CARD: {name: string, display: string}}}}
   */
  static get applicant_certType_detail() {
    return {
      name: 'applicant..certType',
      de: {
        IDENTITY_CARD: {
          name: 'identity_card',
          display: '身份证'
        }
      }
    }
  }

  /**
   * 流转方式
   * @returns {{name: string, de: {RENTAL: {name: string, display: string}, TRANSFER: {name: string, display: string}, SWAP: {name: string, display: string}, SUBCONTRACT: {name: string, display: string}, SHARES: {name: string, display: string}}}}
   */
  static get landDetail_transferWay_detail() {
    return {
      name: 'landDetail..transferWay',
      de: {
        RENTAL: {
          name: 'rental',
          display: '出租'
        },
        TRANSFER: {
          name: 'transfer',
          display: '转让'
        },
        SWAP: {
          name: 'swap',
          display: '互换'
        },
        SUBCONTRACT: {
          name: 'subcontract',
          display: '转包'
        },
        SHARES: {
          name: 'shares',
          display: '入股'
        }
      }
    }
  }

  /**
   * 面积单位
   * @returns {{name: string, de: {MU: {name: string, display: string}, SQUAREMETER: {name: string, display: string}, HECTARE: {name: string, display: string}}}}
   */
  static get landDetail_details_areaUnit_detail() {
    return {
      name: 'landDetail..details..areaUnit',
      de: {
        MU: {
          name: 'mu',
          display: '亩'
        },
        SQUAREMETER: {
          name: 'squareMeter',
          display: '平方米'
        },
        HECTARE: {
          name: 'hectare',
          display: '公顷'
        }
      }
    }
  }

  /**
   * 土地类型
   * @returns {{name: string, de: {FARM: {name: string, display: string}, GARDEN: {name: string, display: string}, WATER: {name: string, display: string}, FACILITY: {name: string, display: string}, WASTER: {name: string, display: string}, FOREST: {name: string, display: string}, ASSETS: {name: string, display: string}, STOCK: {name: string, display: string}}}}
   */
  static get landDetail_details_category_detail() {
    return {
      name: 'landDetail..details..category',
      de: {
        FARM: {
          name: 'farm',
          display: '耕地'
        },
        GARDEN: {
          name: 'garden',
          display: '园地'
        },
        WATER: {
          name: 'water',
          display: '养殖水面'
        },
        FACILITY: {
          name: 'facility',
          display: '农业用地'
        },
        WASTER: {
          name: 'waster',
          display: '四荒地'
        },
        FOREST: {
          name: 'forest',
          display: '林权'
        },
        ASSETS: {
          name: 'assets',
          display: '实物资产'
        },
        STOCK: {
          name: 'stock',
          display: '产权股权'
        }
      }
    }
  }

  /**
   * 他全证书状态
   * @returns {{name: string, de: {NONE: {name: string, display: string}, DONE: {name: string, display: string}}}}
   */
  static get certificateStatus_detail() {
    return {
      name: 'certificateStatus',
      de: {
        NONE: {
          name: 'none',
          display: '未生成他权证书'
        },
        DONE: {
          name: 'done',
          display: '已生成他权证书'
        }
      }
    }
  }

  /**
   * 权属证明状态
   * @returns {{name: string, de: {NONE: {name: string, display: string}, DONE: {name: string, display: string}}}}
   */
  static get ownershipStatus_detail() {
    return {
      name: 'ownershipStatus',
      de: {
        NONE: {
          name: 'none',
          display: '未生成权属证明'
        },
        DONE: {
          name: 'done',
          display: '已生成权属证明'
        }
      }
    }
  }

  static init() {
    this.dict = new Dict(details);
  }
}

var details = [Dict.status_detail,
  Dict.applicant_gender_detail,
  Dict.applicant_certType_detail,
  Dict.landDetail_transferWay_detail,
  Dict.landDetail_details_areaUnit_detail,
  Dict.landDetail_details_category_detail,
  Dict.certificateStatus_detail,
  Dict.ownershipStatus_detail];

module.exports = Dict;
