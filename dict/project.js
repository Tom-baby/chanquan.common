/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File project
 * @Date 17-1-4
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var BaseDict = require('./baseDict');

class ProjectDict extends BaseDict {
    constructor(details) {
        super(details);
    }

    /**
     * 项目状态
     * @returns {{name: string, de: {CREATED: {name: string, display: string}, REQUESTED: {name: string, display: string}, APPROVED_L1: {name: string, display: string}, APPROVED_L2: {name: string, display: string}, APPROVED_L3: {name: string, display: string}, APPROVED_L4: {name: string, display: string}, REQUEST_PUBLISH: {name: string, display: string}, PUBLISHED: {name: string, display: string}, REJECTED: {name: string, display: string}, BIDDING: {name: string, display: string}, TRADED: {name: string, display: string}, DELETED: {name: string, display: string}}}}
     */
    static get status_detail() {
        return {
            name: 'status',
            de: {
                CREATED: {
                    name: 'created',
                    display: '已录入'
                },
                REQUESTED: {
                    name: 'requested',
                    display: '申请审核'
                },
                APPROVED_L1: {
                    name: 'approved_l1',
                    display: '省审核通过'
                },
                APPROVED_L2: {
                    name: 'approved_l2',
                    display: '市审核通过'
                },
                APPROVED_L3: {
                    name: 'approved_l3',
                    display: '区县审核通过'
                },
                APPROVED_L4: {
                    name: 'approved_l4',
                    display: '乡镇审核通过'
                },
                REQUEST_PUBLISH: {
                    name: 'request_publish',
                    display: '已审核'
                },
                PUBLISHED: {
                    name: 'published',
                    display: '已发布'
                },
                WITHDRAWED: {
                    name: 'withdrawed',
                    display: '已摘牌'
                },
                REJECTED: {
                    name: 'rejected',
                    display: '已驳回'
                },
                BIDDING: {
                    name: 'bidding',
                    display: '竞价中'
                },
                BIDDED: {
                    name: 'bidded',
                    display: '竞价结束'
                },
                PAUSED: {
                    name: 'paused',
                    display: '暂停'
                },
                TRADED: {
                    name: 'traded',
                    display: '成交'
                },
                DELETED: {
                    name: 'deleted',
                    display: '已删除'
                },
                TERMINATED: {
                    name: 'terminated',
                    display: '已结束'
                }
            }
        }
    }

    /**
     * 类型
     * @returns {{name: string, de: {TRANSFER: {name: string, display: string}, DEMAND: {name: string, display: string}}}}
     */
    static get prjType_detail() {
        return {
            name: 'prjType',
            de: {
                TRANSFER: {
                    name: 'transfer',
                    display: '转出'
                },
                DEMAND: {
                    name: 'demand',
                    display: '需求'
                }
            }
        }
    }

    /**
     * 项目分类
     * @returns {{name: string, de: {ALL: {name: string, display: string}, FARM: {name: string, display: string}, GARDON: {name: string, display: string}, WATER: {name: string, display: string}, FACILITY: {name: string, display: string}, WASTER: {name: string, display: string}, FOREST: {name: string, display: string}, ASSETS: {name: string, display: string}, STOCK: {name: string, display: string}}}}
     */
    static get category_detail() {
        return {
            name: 'category',
            actions: [BaseDict.enum_action.list],
            de: {
                ALL: {
                    name: 'all',
                    display: '所有'
                },
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
                    display: '林地'
                },
                ASSETS: {
                    name: 'assets',
                    display: '实物资产'
                },
                STOCK: {
                    name: 'stock',
                    display: '产权股权'
                },
                CONSTRUCTION: {
                    name: 'construction',
                    display: '建设用地'
                },
                OTHER: {
                    name: 'other',
                    display: '涉农项目'
                }
            }
        }
    }


    /**
     *
     * @returns {{name: string, de: {PERSONAL: {name: string, display: string}, COMPANY: {name: string, display: string}}}}
     */
    static get sponsorType_detail() {
        return {
            name: 'sponsorType',
            de: {
                PERSONAL: {
                    name: 'personal',
                    display: '个人'
                },
                COMPANY: {
                    name: 'company',
                    display: '公司'
                },
                VILLAGE: {
                    name: 'village',
                    display: '集体'
                },
                COOPERATIVE: {
                    name: 'cooperative',
                    display: '合作社'
                }
            }
        }
    }

    /**
     * 产权性质
     * @returns {{name: string, de: {PERSONAL: {name: string, display: string}, COMPANY: {name: string, display: string}}}}
     */
    static get propertyType_detail() {
        return {
            name: 'propertyType',
            de: {
                PERSONAL: {
                    name: 'collective',
                    display: '集体所有'
                },
                COMPANY: {
                    name: 'stateowned',
                    display: '国有'
                },
                FIXEDASSET: {
                    name: 'fixedAsset',
                    display: '实物资产'
                }
            }
        }
    }

    /**
     * 承包方式
     * @returns {{name: string, de: {HOUSEHOLD: {name: string, display: string}, NON-HOUSEHOLD: {name: string, display: string}, OTHER: {name: string, display: string}}}}
     */
    static get contractType_detail() {
        return {
            name: 'contractType',
            de: {
                HOUSEHOLD: {
                    name: 'household',
                    display: '家庭承包'
                },
                NONHOUSEHOLD: {
                    name: 'nonhousehold',
                    display: '国有'
                },
                OTHER: {
                    name: 'other',
                    display: '其他'
                },
            }
        }
    }

    /**
     * 他项权利内容
     * @returns {{name: string, de: {MORTGATE: {name: string, display: string}, PLEDGE: {name: string, display: string}, OTHER: {name: string, display: string}}}}
     */
    static get otherRightHolders_otherRightDetail_detail() {
        return {
            name: 'OtherRightHolders..otherRightDetail',
            de: {
                MORTGATE: {
                    name: 'mortgate',
                    display: '抵押'
                },
                PLEDGE: {
                    name: 'pledge',
                    display: '质押'
                },
                OTHER: {
                    name: 'other',
                    display: '其他'
                }
            }
        }
    }


    /**
     * 标的类别
     * @returns {{name: string, de: {HOUSE: {name: string, display: string}, MOTOR: {name: string, display: string}, FARM-MACHINERY: {name: string, display: string}, SEED: {name: string, display: string}, LIVESTOCK: {name: string, display: string}, others: {name: string, display: string}}}}
     */
    static get targetType_detail() {
        return {
            name: 'targetType',
            de: {
                HOUSING: {
                    name: 'housing',
                    display: '房屋'
                },
                FACILITIES: {
                    name: 'facilities',
                    display: '农业生产设施设备'
                },
                COLLECTIVEENTERPRISE: {
                    name: 'collectiveenterprise',
                    display: '集体企业'
                },
                SEEDLING: {
                    name: 'seedling',
                    display: '苗'
                },
                STOCK: {
                    name: 'stock',
                    display: '股权'
                },
                LIVESTOCK: {
                    name: 'liveStock',
                    display: '种畜禽'
                },
                SHOPS: {
                    name: 'shops',
                    display: '商铺'
                },
                WATERCONSERVANCY: {
                    name: 'waterConservancy',
                    display: '小型水利设施'
                },
                BUILDINGS: {
                    name: 'buildings',
                    display: '房屋建筑物类'
                },
                EQUIPMENT: {
                    name: 'equipment',
                    display: '机械设备类'
                },
                FOREST: {
                    name: 'forest',
                    display: '木'
                },
                FACILITY: {
                    name: 'facility',
                    display: '办公设施类'
                },
                INFRASTURCTURE: {
                    name: 'infrasturcture',
                    display: '公益基础设施'
                },
                VEHICLE: {
                    name: 'vehicle',
                    display: '交通工具'
                },
                OTHERS: {
                    name: 'others',
                    display: '其他'
                },
                CULTIVATEDLAND: {
                    name: 'cultivatedLand',
                    display: '耕地'
                },
                WASTELAND: {
                    name: 'wasteland',
                    display: '荒地'
                },
                WASTEGULLY: {
                    name: 'wastegully',
                    display: '荒沟'
                },
                COLLECTIVELAND: {
                    name: 'collectiveLand',
                    display: '集体建设'
                },
                HOMESTEAD: {
                    name: 'homestead',
                    display: '宅基地'
                },
                FREEDISPOSEDLAND: {
                    name: 'freeDisposedLand',
                    display: '机动地'
                },
                FAMILYCONTRACT: {
                    name: 'familyContract',
                    display: '家庭承包'
                },
                OTHERLAND1: {
                    name: 'otherLand1',
                    display: '其他土地类1'
                },
                OTHERLAND2: {
                    name: 'otherLand2',
                    display: '其他土地类2'
                },
                RESERVOIR: {
                    name: 'reservoir',
                    display: '水库'
                },
                FISHPOND: {
                    name: 'fishpond',
                    display: '鱼塘'
                },
                OTHERRESOURCE: {
                    name: 'otherResource',
                    display: '其他资源类'
                },
                NEWPLANT: {
                    name: 'newPlant',
                    display: '植物新品种'
                },
                PATENT: {
                    name: 'patent',
                    display: '农业专利权'
                },
                TRADE: {
                    name: 'trade',
                    display: '农产品商标权'
                },
                COPYRIGHT: {
                    name: 'copyright',
                    display: '农业著作权'
                }
            }
        }
    }

    /**
     * 转出方式
     * @returns {{name: string, de: {RENTAL: {name: string, display: string}, TRANSFER: {name: string, display: string}, SWAP: {name: string, display: string}, SUBCONTRACT: {name: string, display: string}, SHARES: {name: string, display: string}}}}
     */
    static get transferWay_detail() {
        return {
            name: 'transferWay',
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
                CONTRACT: {
                    name: 'contract',
                    display: '发包'
                },
                SUBCONTRACT: {
                    name: 'subcontract',
                    display: '转包'
                },
                SHARES: {
                    name: 'shares',
                    display: '入股'
                },
                CLAIM: {
                    name: 'claim',
                    display: '认领'
                },
                TRUSTEESHIP: {
                    name: 'trusteeship',
                    display: '托管'
                },
                OTHER: {
                    name: 'other',
                    display: '其他'
                }
            }
        }
    }

    /**
     * 挂牌价格单位
     * @returns {{name: string, action: *[], de: {YUAN-PER-MU-YEAR: {name: string, display: string}, YUAN-PER-SM-YEAR: {name: string, display: string}, YUAN: {name: string, display: string}, YUAN-PER-YEAR: {name: string, display: string}}}}
     */
    static get priceUnit_detail() {
        return {
            name: 'priceUnit',
            actions: [BaseDict.enum_action.list, BaseDict.enum_action.de],
            de: {
                'YUAN-PER-MU-YEAR': {
                    name: '1',
                    display: '元/亩/年'
                },
                'YUAN-PER-SM-YEAR': {
                    name: '2',
                    display: '元/平方米/年'
                },
                YUAN: {
                    name: '3',
                    display: '元（总价）'
                },
                'YUAN-PER-YEAR': {
                    name: '4',
                    display: '元/年'
                },
                'YUAN-PER-HECTARE-YEAR': {
                    name: '5',
                    display: '元/公顷/年'
                },
                'YUAN-PER-MU-YEAR_POINT': {
                    name: '6',
                    display: '元/亩•年'
                },
                'YUAN-PER-SM-YEAR_POINT': {
                    name: '7',
                    display: '元/平方米•年'
                },
                'YUAN-PER-YEAR_POINT': {
                    name: '8',
                    display: '元/年'
                },
                'YUAN-PER-HECTARE-YEAR_POINT': {
                    name: '9',
                    display: '元/公顷•年'
                },
              'YUAN-PER-MU-DAY': {
                name: '10',
                display: '元/平方米/天'
              },
              'YUAN-PER-SM-YEAR_POINTS': {
                name: '11',
                display: '元/平方米/年'
              },
              'YUAN-PER-MU-YEAR_POINTS': {
                name: '12',
                display: '元/亩/年'
              },
              'YUAN-PER-HECT-YEAR_POINTS': {
                name: '13',
                display: '元/顷/年'
              },
              'YUAN-PER-RICE-YEAR_POINTS': {
                name: '14',
                display: '元/米/年'
              },
              'YUAN-PER-RICE_POINTS': {
                name: '15',
                display: '元/米'
              }
            //   "yuan_per_hect_year_points": "13",
            // "yuan_per_rice_year_points": "14"
            }
        }
    }


    /**
     * 交易价款付款方式
     * @returns {{name: string, de: {ONE-TIME-PAYMENT: {name: string, display: string}, ONSITE-PAYMENT: {name: string, display: string}, INSTALLMENT-PAYMENT: {name: string, display: string}}}}
     */
    static get paymentWay_detail() {
        return {
            name: 'paymentWay',
            de: {
                'ONE-TIME-PAYMENT': {
                    name: 'one-time-payment',
                    display: '一次性支付，全部交易价款'
                },
                'ONSITE-PAYMENT': {
                    name: 'onsite-payment',
                    display: '进场结算'
                },
                'INSTALLMENT-PAYMENT': {
                    name: 'installment-payment',
                    display: '分期付款'
                }
            }
        }
    }


    /**
     * 缴纳形式
     * @returns {{name: string, de: {CASH: {name: string, display: string}, CHECK: {name: string, display: string}, DRAFT: {name: string, display: string}, TELE-TRANSFER: {name: string, display: string}}}}
     */
    static get depositWay_detail() {
        return {
            name: 'depositWay',
            de: {
                CASH: {
                    name: 'cash',
                    display: '现金汇缴'
                },
                CHECK: {
                    name: 'check',
                    display: '支票'
                },
                DRAFT: {
                    name: 'draft',
                    display: '汇票'
                },
                'TELE-TRANSFER': {
                    name: 'tele-transfer',
                    display: '电汇'
                }
            }
        }
    }

    /**
     * 交易方式
     * @returns {{name: string, de: {FREE-BID: {name: string, display: string}, STEP-BID: {name: string, display: string}, AUCTION: {name: string, display: string}, BIDDING: {name: string, display: string}, OTHER: {name: string, display: string}}}}
     */
    static get transactionWay_detail() {
        return {
            name: 'transactionWay',
            de: {
                'FREEBID': {
                    name: 'freebid',
                    display: '自由竞价'
                },
                'STEPBID': {
                    name: 'stepbid',
                    display: '阶梯竞价'
                },
                AUCTION: {
                    name: 'auction',
                    display: '拍卖'
                },
                BIDDING: {
                    name: 'bidding',
                    display: '招投标'
                },
                OTHER: {
                    name: 'other',
                    display: '其他'
                }
            }
        }
    }

    /**
     * 挂牌期满后，如未征集到满足摘牌条件的意向受让方
     * @returns {{name: string, de: {TERMINATE: {name: string, display: string}, DELAY: {name: string, display: string}, RE-PUBLISH: {name: string, display: string}}}}
     */
    static get noTransferee_detail() {
        return {
            name: 'noTransferee',
            de: {
                TERMINATE: {
                    name: 'terminate',
                    display: '信息发布终结'
                },
                DELAY: {
                    name: 'delay',
                    display: '延长信息发布（不变更挂牌条件，直至征集到意向受让方）'
                },
                'REPUBLISH': {
                    name: 'republish',
                    display: '变更公告内容，重新挂牌'
                }
            }
        }
    }

    /**
     * 证件类型
     * @returns {{name: string, de: {IDENTITY_CARD: {name: string, display: string}}}}
     */
    static get sponsor_certType_detail() {
        return {
            name: 'sponsor..certType',
            de: {
                IDENTITY_CARD: {
                    name: 'identity-card',
                    display: '身份证'
                }
            }
        }
    }

    /**
     * 面积单位
     * @returns {{name: string, de: {IDENTITY_CARD: {name: string, display: string}}}}
     */
    static get areaUnit_detail() {
        return {
            name: 'areaUnit',
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
                },
                HECT: {
                    name: 'hect',
                    display: '顷'
                },
                RICE: {
                    name: 'rice',
                    display: '米'
                }
            }
        }
    }

    /**
     * 面积单位
     * @returns {{name: string, de: {IDENTITY_CARD: {name: string, display: string}}}}
     */
    static get land_unit_detail() {
        return {
            name: 'unit',
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
                },
                HECT: {
                    name: 'hect',
                    display: '顷'
                },
                RICE: {
                    name: 'rice',
                    display: '米'
                }
            }
        }
    }

    /**
     * 资产单位
     * @returns {{name: string, de: {SM: {name: string, display: string}, M: {name: string, display: string}, GE: {name: string, display: string}, ZHAN: {name: string, display: string}, YAN: {name: string, display: string}, MU: {name: string, display: string}, KOU: {name: string, display: string}, TAO: {name: string, display: string}, JIAN: {name: string, display: string}}}}
     */
    static get asset_unit_detail() {
        return {
            name: 'unit',
            de: {
                SM: {
                    name: 'sm',
                    display: '平方米'
                },
                M: {
                    name: 'm',
                    display: '米'
                },
                GE: {
                    name: 'ge',
                    display: '个'
                },
                ZHAN: {
                    name: 'zhan',
                    display: '盏'
                },
                YAN: {
                    name: 'yan',
                    display: '眼'
                },
                MU: {
                    name: 'mu',
                    display: '亩'
                },
                KOU: {
                    name: 'kou',
                    display: '口'
                },
                TAO: {
                    name: 'tao',
                    display: '套'
                },
                JIAN: {
                    name: 'jian',
                    display: '间'
                },
                KE: {
                    name: 'ke',
                    display: '棵'
                },
                TAI: {
                    name: 'tai',
                    display: '台'
                },
                LIANG: {
                    name: 'liang',
                    display: '辆'
                }
            }
        }
    }

    static init() {
        this.dict = new ProjectDict(details);
    }
}

var details = [ProjectDict.status_detail,
    ProjectDict.prjType_detail,
    ProjectDict.category_detail,
    ProjectDict.sponsorType_detail,
    ProjectDict.propertyType_detail,
    ProjectDict.contractType_detail,
    ProjectDict.otherRightHolders_otherRightDetail_detail,
    ProjectDict.targetType_detail,
    ProjectDict.transferWay_detail,
    ProjectDict.priceUnit_detail,
    ProjectDict.paymentWay_detail,
    ProjectDict.depositWay_detail,
    ProjectDict.transactionWay_detail,
    ProjectDict.noTransferee_detail,
    ProjectDict.sponsor_certType_detail,
    ProjectDict.areaUnit_detail,
    ProjectDict.land_unit_detail,
    ProjectDict.asset_unit_detail
];

module.exports = ProjectDict;