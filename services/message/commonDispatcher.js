/**
 * Created by zeqi
 * Dispatch Interface is used to generate message-ref record in user queue based on biz logic requirement,
 * So it is business specific, different business layer will  deliver/register
 * the dispatch implementation individually
 * @module
 * @version 1.0.0
 * @author lizh
 */

'use strict';

var path = require('path');
var Mustache = require('mustache');
var logger = require('../logUtil').getLogger('chanquan:common:services:message:commonDispatcher');
var fs = require('fs');
var Q = require('q');
var util = require('util');
var Event = require('events');

/**
 * Abstract class define the basic shape/behavior of Dispatcher
 */
class Dispatcher {

  /**
   * Constructor method which use to create a dispatcher instance
   */
  constructor(templateHome, msgStore, qWriter) {
    this.templateHome = templateHome;
    this._msgStore = msgStore;
    this._qWrite = qWriter;
  }

  set templateHome(templateHome) {
    this._templateHome = templateHome || __dirname + '/services/messages/templates';
  }

  get templateHome() {
    return this._templateHome;
  }

  static get putToQ_event() {
    return 'putToQ';
  }

  /**
   * The attribute for the dispatcher name
   * The name could be a qname, it should be unique
   * It can be used as the regitry key for dispatcher
   * instance look up
   *
   * @abstract
   */
  get NAME() {
    return 'BASE_DISPATCHER';
  }

  /**
   * Render a message payload via mustach template
   *
   * @parma <string>, the mustache template id
   *   The template id name convention is <I|W|E>-<FeatureID>-<ShortTemplateID>-<msgType>.mustache
   *   e.g:
   *      For INFO message: I-ORDER-10000000-Wechat_Text.mustache
   *      For Warning message: W-ORDER-10000000-Nong_Internal.mustach
   *      For Error message: E-ORDER-10000000-Mobile_SMS.mustach
   * @param <string>, message type, the type of the message. e.g: "Wechat:Text"
   * @param <object>, JSON object, contain the data which will fill in the template
   *
   * @return <string>, return a redenerred string
   *
   * @protected
   *
   */
  renderMsg(templateId, msgType, replacement) {
    var method = 'renderMsg';
    logger.debug(method + ' [Enter]');
    try {
      if (!templateId) {
        logger.error(method + ' [Exit], not a template msg: ' + replacement);
        return replacement;
      }

      // TODO, cache is needed in future featrues
      var templateFile = templateId + '-' + msgType.replace(new RegExp(/(:)/g), '_') + '.mustache';
      templateFile = path.join(this.templateHome, templateFile);
      if (!fs.existsSync(templateFile)) {
        logger.error(method + ' [Exit](failed)' + ' Missing template file "' + templateFile + '"');
        throw new Error('Missing template file: "' + templateFile + '"');
      }

      var template = fs.readFileSync(templateFile, 'utf-8');
      Mustache.parse(template);
      var msgPayload = Mustache.render(template, replacement);
      logger.debug(method + ' [Exit], render result: ' + msgPayload);
      return msgPayload;
    } catch (err) {
      logger.error('Error occurs during render message, due to: ', err);
      logger.error(method + ' [Exit](failed)');
      throw err;
    }
  }

  /**
   * Create a message(s) record in person queue
   * For specific message generator, it may create
   * multiple message records to different endpoints
   * Each business module who want to trigger message,
   * they can contribute a dispatcher implementation,
   * and register it into message registry during server initial phase
   *
   * @param <object>, message holder
   *   {
	 *      headers: {
	 *        msgId: <string>,
	 *        from: <qname>,
	 *        to: <qname>,
	 *        msgType: <string>,
	 *        QoS: <number>
	 *      },
	 *      dataHolder : {
   *        templateId: <string>,
	 *        replacement: <object>
	 *      }
	 *   }
   * @param <string>, message-ref, the UUID which can identify a message in the message store
   * @param <string>, the message-id, the ID of the message, please note: the is protocol layer message ID, the same ID may have different message to present the different status of the message exchange, e.g: message may have conn, REQ, RES and ACK status
   * @param <string>, the message-type qname, which can tell the dispatcher what protocol and message format need to be used for the message
   * @param <string>|<Array>, target person IDs
   *
   *
   * @param <object>, options, the options for the dispatch
   *
   * @return <promise>, promise type with an array of created message-ref records
   *
   * @public
   * @final
   *
   */
  dispatch(msgHolder, options, callback) {
    var method = '[dispatch]';
    var self = this;

    if (options && 'function' === typeof options) {
      callback = options;
      options = null;
    }

    try {
      var payload = null;

      // data holder has assoicated template,
      // need translation
      if (msgHolder.dataHolder.templateId) {
        payload = self.renderMsg(msgHolder.dataHolder.templateId, msgHolder.headers.msgType, msgHolder.dataHolder.replacement);
      } else if (msgHolder.dataHolder.replacement) {
        payload = msgHolder.dataHolder.replacement;
      } else {
        payload = msgHolder.dataHolder;
      }

      var message = {
        msgId: msgHolder.headers.msgId,
        from: msgHolder.headers.from,
        to: msgHolder.headers.to,
        msgType: msgHolder.headers.msgType,
        QoS: msgHolder.headers.QoS,
        payload: payload
      };

      var createdMsg = null;
      var endpoints = null;
      var domain = options && options.domain;
      return self.saveToStore(domain, message).then(function (msg) {
        logger.debug(method + ' Created message in message store: ', msg);
        createdMsg = msg;
        return self.settleTargets(message.to, message.msgType, options);
      }).then(function (endpoints) {
        logger.debug(method + ' Relevant endpoints: ', endpoints);
        var opts = message;
        return self.putToQ(domain, createdMsg._id.toString(), opts, endpoints);
      }).then(function (msgRefs) {
        logger.debug(method + ' Message references created: ', msgRefs);
        return {
          msgStore: createdMsg,
          msgQueue: msgRefs
        };
      }).fail(function (error) {
        logger.error('Error occurs for put message to queue, due to: ', error);
        throw error;
      }).nodeify(callback);
    } catch (err) {
      logger.error('Erros ocurs during dispatching message to Q: ', err);
      return Q.reject(err).nodeify(callback);
    }
  }

  /**
   * Put the message-ref to target queues
   *
   * @param {string}, message-ref
   * @param {object}, options, including message id, from, target, endpoint, msgType
   * @param {array}, array of endpoints, e.g: {target: <string>, endpointType: <string>, address: <string>}
   * @param {function}, callback, optional
   *
   * @return {promise}, the created message-refs
   * @protected
   */
  putToQ(domain, msgRef, opts, endpoints, callback) {
    var self = this;
    try {
      if (!endpoints || 0 === endpoints.length) {
        return Q.reject(new Error('Invalid endpoints value: ' + endpoints)).nodeify(callback);
      }
      var msgRefs = [];
      endpoints.forEach(function (endpoint) {
        msgRefs.push({
          msgRef: msgRef,
          msgId: opts.msgId,
          from: opts.from,
          target: endpoint.target,
          endpoint: {
            endpointType: endpoint.endpointType,
            address: endpoint.address
          },
          msgType: opts.msgType
        });
      });
      return self._qWrite.post(msgRefs, null, domain).then(data=> {
        self.emit(Dispatcher.putToQ_event, {docs: data, domain: domain});
        return data;
      }).nodeify(callback);
    } catch (err) {
      logger.error('Error occurs during put message into Q, due to: ', err);
      return Q.reject(err).nodeify(callback);
    }
  }

  /**
   * Save the message to message store
   *
   * @param {object}, message
   * @return {promise}, message-ref
   *
   * @private
   * @final
   */
  saveToStore(domain, msg, callback) {
    var self = this;
    try {
      if (!msg) {
        return Q.reject(new Error('Invalid message: ' + msg)).nodeify(callback);
      }
      return self._msgStore.post(msg, null, domain).nodeify(callback);
    } catch (error) {
      return Q.reject(new Error('Error occurs during daving message to store due to: ' + error)).nodeify(callback);
    }
  }

  /**
   * Each concrete dispatch need to implement this method to translate the "to" qname
   * to specific target person and(or) endpoints
   * @param <string>, qname of to presentation
   * @param <string>, the message-type qname, which can tell the dispatcher what protocol and message format need to be used for the message
   * @param <object>, options, the options for the dispatch
   * @param <function>, callback(error, result), optional parameter
   *
   * @return {promise}, value is array of target and endpoint address information
   * e.g:
   * [{
	 *   target: <string>,
	 *   endpointType: <string>,
	 *   address: <string>
	 * }]
   *
   * @public
   *
   * @abstract
   */
  settleTargets(to, msgType, options, callback) {
    throw Error('No implementation as abstract method in base class');
  }
}

util.inherits(Dispatcher, Event.EventEmitter);

module.exports = Dispatcher;
