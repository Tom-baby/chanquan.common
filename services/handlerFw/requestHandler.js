
'use strict'

let Q = require('q');

class RequestHandler {

  doRequest(context){
    throw new Error("doRequest not implemented");
  }

  doFailure(context){
    return Q();
  }
}

module.exports = exports = RequestHandler;