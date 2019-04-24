'use strict'

var logger = require('../logUtil').getLogger('chanquan:common:requestHandlerService');

let Q = require('q');

let Context = require('./context');

class RequestHandlerService{

  handle(context, callback){
    if(!context)
      throw new Error("Invalid context: undefined.");

    if(!context instanceof Context)
      throw new Error("Invalid context.");

    if(!context.userInfo)
      throw new Error("No userInfo in context.");

    let domain = context.userInfo.domain;

    if (!domain) {
      throw new Error("Invalid context: no domain");
    }

    return this.preHandle(context, callback).then(() => {
      return this.doHandle(context, callback);
    }).then(() => {
      logger.debug(context.name, "before  post handle");
      return this.postHandle(context, callback);
    }).fail(error => {
      throw error;
    });

  }

  preHandle(context, callback) {
    logger.debug(context.name, "begin preHandle");
    let deferred = Q.defer();
    let preHandlerList = context.getPreRequestHandlers();
    if(!preHandlerList) {
      logger.debug(context.name, "quit preHandle for empty preRequest handler list");
      return Q();
    }

    let cursor = 0;
    try{
      this._exePreHandle(context, deferred, cursor).fail(error => {
        throw error;
      })
    }catch(err){
      deferred.reject(err);
    }
    return deferred.promise.nodeify(callback);
  }

  _exePreHandle(context, deferred, cursor){
    logger.debug(context.name, "_exePreHandle: ");
    if(cursor >= context.getPreRequestHandlers().length)
      deferred.resolve();

    return context.getPreRequestHandlers()[cursor].preRequest(context).
    then(() => {
      cursor ++;
      return this._exePreHandle(context, deferred, cursor).fail(error => {
        throw error;
      });
    }).fail(error => {
      deferred.reject(error);
    })
  }


  doHandle(context, callback){
    let deferred = Q.defer();
    let handlerList = context.getRequestHandlers();

    if(!handlerList) {
      logger.debug(context.name, "quit doHandle for empty request handler list");
      return Q();
    }

    let cursor = 0;
    try{
      this._exeHandle(context, deferred, cursor).fail(error => {
        throw error;
      })
    }catch(error){
      logger.error(error);
      this._exeErrorHandle(context, deferred, cursor, error);
    }

    return deferred.promise.nodeify(callback);
  }

  _exeHandle(context, deferred, cursor){
    logger.debug(context.name, " _exeHandle");
    let reqHandlerList = context.getRequestHandlers();
    if(cursor >= reqHandlerList.length)
      deferred.resolve();

    return reqHandlerList[cursor].doRequest(context).
    then(() => {
      cursor ++;
      return this._exeHandle(context, deferred, cursor);
    }).fail(error => {
      throw error;
    })
  }

  _exeErrorHandle(context, deferred, cursor, error){
    let reqHandlerList = context.getRequestHandlers();
    if(cursor < 0)
      deferred.reject(error);

    return reqHandlerList[cursor].doFailure(context).then(() => {
      cursor--;
      return this._exeErrorHandle(context, deferred, cursor, error);
    }).fail(error => {
      logger.error(reqHandlerList[i=cursor], " rollback failed:", error);
      //throw error;

    });
  }

  postHandle(context, callback){
    let deferred = Q.defer();
    let postHandlerList = context.getPostRequestHandlers();

    if(!postHandlerList) {
      logger.debug("quit postHandle for empty postRequest handler list");
      return Q();
    }
    logger.debug(context.name, " postHandle");
    let cursor = 0;
    try{
      this._exePostHandle(context, deferred, cursor).fail(error => {
        deferred.reject(error);
      })
    }catch(err){
      deferred.reject(err);
    }

    return deferred.promise.nodeify(callback);
  }

  _exePostHandle(context, deferred, cursor){
    let postHandlerList = context.getPostRequestHandlers();
    if(cursor >= postHandlerList.length)
      deferred.resolve();

    return postHandlerList[cursor].postRequest(context).
    then(() => {
      cursor ++;
      return this._exePostHandle(context, deferred, cursor);
    }).fail(error => {
      logger.error("_exePostHandle:", error)
      throw error;
    })
  }
}

let requestHandlerService = new RequestHandlerService();

module.exports = exports = requestHandlerService;