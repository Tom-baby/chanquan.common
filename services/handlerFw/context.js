
'use strict'

let PreRequestHandler = require('./preRequestHandler');
let PostRequestHandler = require('./postRequestHandler');
let RequestHandler = require('./requestHandler');

class Context {
  constructor(name, reqData, userInfo){
    this.name = name;
    this.reqData = reqData;
    this.userInfo = userInfo;
    this.preRequestHanderList = null;
    this.postRequstHandlerList = null;
    this.requestHandlerList = null;
    this.resData = null;
  }

  addHandler(handler){
    if(!handler){
      return;
    }
    if(handler instanceof PreRequestHandler)
    {
      if(!this.preRequestHanderList)
        this.preRequestHanderList = [];
      this.preRequestHanderList.push(handler);

    }
    if(handler instanceof RequestHandler)
    {
      if(!this.requestHandlerList)
        this.requestHandlerList = [];
      this.requestHandlerList.push(handler);

    }
    if(handler instanceof PostRequestHandler)
    {
      if(!this.postRequstHandlerList)
        this.postRequstHandlerList = [];
      this.postRequstHandlerList.push(handler);

    }
  }

  getPreRequestHandlers()
  {
    return this.preRequestHanderList;
  }

  getRequestHandlers()
  {
    return this.requestHandlerList;
  }

  getPostRequestHandlers()
  {
    return this.postRequstHandlerList;
  }

}

module.exports = exports = Context;