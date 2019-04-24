/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File baseDict
 * @Date 17-1-4
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var str = '$[1].population[0].name';
var logger = require('../services/logUtil').getLogger('chanquan:dict:baseDict');
var jp = require('jsonpath');

class BaseDict {
  constructor(details) {
    var self = this;
    if (Array.isArray(details)) {
      details.forEach(detail=> {
        self.enum_handler(detail);
      });
    }
  }

  enum_handler(detail) {
    var self = this;
    if (detail.name && detail.de) {
      var de = detail.de;
      for (var key in de) {
        //Default include BaseDict.enum_action.dis
        if (typeof key == 'string' && de[key].name && de[key].display) {
          if (!self[detail.name])
            self[detail.name] = {};
          self[detail.name][de[key].name] = de[key].display;
        }

        if (Array.isArray(detail.actions)) {
          detail.actions.forEach(action=> {
            var attri = detail.name + '_enum_' + action;
            switch (action) {
              case BaseDict.enum_action.de:
                if (typeof key == 'string' && de[key].name) {
                  if (!self[attri])
                    self[attri] = {};
                  self[attri][key] = de[key].name;
                }
                break;
              case BaseDict.enum_action.list:
                if (typeof key == 'string' && de[key].name && de[key].display) {
                  if (!Array.isArray(self[attri]))
                    self[attri] = [];
                  self[attri].push({key: de[key].name, value: de[key].display});
                }
                break;
              case BaseDict.enum_action.dis:
                break;
              default:
                logger.warn(method, 'Action invalid', action);
                break;
            }
          });
        }
      }
    }
  }

  static get detail() {
    return {
      name: 'base_detail',
      actions: [BaseDict.enum_action.de, BaseDict.enum_action.list],  //Contain by default BaseDict.enum_action.dis
      de: {
        name: 'base',
        display: '基类'
      }
    };
  }

  static get enum_action() {
    return {
      de: 'de',
      dis: 'dis', //Contain by default
      list: 'list'
    }
  }

  static enum_handler(detail, action) {
    var en = null;
    var method = 'enum_handler';
    if (detail.name && detail.de) {
      var de = detail.de;
      for (var key in de) {
        switch (action) {
          case BaseDict.enum_action.de:
            if (typeof key == 'string' && de[key].name) {
              if (!en)
                en = {};
              en[key] = de[key].name;
            }
            break;
          case BaseDict.enum_action.dis:
            if (typeof key == 'string' && de[key].name && de[key].display) {
              if (!en)
                en = {};
              en[de[key].name] = de[key].display;
            }
            break;
          case BaseDict.enum_action.list:
            if (typeof key == 'string' && de[key].name && de[key].display) {
              if (!Array.isArray(en))
                en = [];
              en.push({key: de[key].name, value: de[key].display});
            }
            break;
          default:
            logger.warn(method, 'Action invalid', action);
            break;
        }
      }
    }
    return en;
  }

  static set dict(dict) {
    this._dict = dict;
  }

  static get dict() {
    if (!this._dict) {
      logger.warn('dict', '(failed) No instantiation constructor ' + this.name, this._dict);
    }
    return this._dict;
  }

  docs_replace_handler_apply(docs, dictAttr) {
    var self = this;
    if (typeof dictAttr != 'string' || typeof self[dictAttr] != 'object') {
      return docs;
    }
    jp.apply(docs, '$..' + dictAttr, function (value) {
      value = self[dictAttr][value] || value;
      return value;
    });
    return docs;
  }

  /**
   * Replace docs property value
   * @param docs {object}
   * @param attrs {Array} Attributes to be replaced ex:['status', 'prjType']
   */
  docs_replace_handler(docs, attrs) {
    var self = this;
    if (docs) {
      if (!Array.isArray(attrs)) {
        for (var dictAttr in self) {
          self.docs_replace_handler_apply(docs, dictAttr);
        }
      }
      else {
        attrs.forEach(item=> {
          self.docs_replace_handler_apply(docs, item);
        });
      }
    }
  }

  docs_append_suffixName_handler_apply(docs, dictAttr, suffixName) {
    var self = this;
    if (typeof dictAttr != 'string' || typeof self[dictAttr] != 'object') {
      return docs;
    }
    jp.nodes(docs, '$..' + dictAttr).forEach(item => {
      var pathExpression = jp.stringify(item.path);
      var display = pathExpression + suffixName;
      jp.value(docs, display, self[dictAttr][item.value]);
    });

    return docs;
  }

  /**
   * Append to docs property name
   * @param docs {object}
   * @param attrs {Array}
   * @param suffixName {string} suffix name
   */
  docs_append_suffixName_handler(docs, attrs, suffixName) {
    var self = this;
    if (typeof suffixName != 'string') {
      suffixName = 'DisplayName';
    }
    if (docs) {
      if (!Array.isArray(attrs)) {
        for (var dictAttr in self) {
          self.docs_append_suffixName_handler_apply(docs, dictAttr, suffixName);
        }
      }
      else {
        attrs.forEach(item=> {
          self.docs_append_suffixName_handler_apply(docs, item, suffixName);
        });
      }
    }
  }

  docs_append_newProperty_handler_apply(docs, dictAttr, newProperty) {
    var self = this;
    if (typeof dictAttr != 'string' || typeof self[dictAttr] != 'object') {
      return docs;
    }
    jp.nodes(docs, '$..' + dictAttr).forEach(item => {
      var pathExpression = jp.stringify(item.path);
      var display = '';
      if (typeof newProperty != 'string') {
        display = pathExpression + 'DisplayName';
      }
      else {
        display = pathExpression.replace(/^(.*)\.(.*)/, "$1." + newProperty);
      }
      jp.value(docs, display, self[dictAttr][item.value]);
    });

    return docs;
  }

  /**
   * Append to docs a new property
   * @param docs {object}
   * @param newProperty {string} new property
   */
  docs_append_newProperty_handler(docs, attrs, newProperty) {
    var self = this;
    if (docs) {
      if (!Array.isArray(attrs)) {
        for (var dictAttr in self) {
          self.docs_append_newProperty_handler_apply(docs, dictAttr, newProperty);
        }
      }
      else {
        attrs.forEach(item=> {
          self.docs_append_newProperty_handler_apply(docs, item, newProperty);
        });
      }
    }
  }
}

module.exports = BaseDict;