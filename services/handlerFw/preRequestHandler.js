
'use strict'

class PreRequestHandler {

  preRequest(context){
    throw new Error("preRequest not implemented");
  }
}

module.exports = exports = PreRequestHandler;