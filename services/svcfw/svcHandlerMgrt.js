/**
 * Phased-hook based Service handler Manager
 *
 * @author lizh
 *
 */
var debug         = require('debug')('chanquan.common:SvcHandlerMgrt');
var Q             = require('q');


/**
 * Service Handler management, add the handler by order(phase based handler invocation), 
 * control the cursor to indicate current processing handler
 */
var SvcHandlerMgrt = function() {
  this.cursor = -1;
  this.handlers = []; 
  this.continueOnError = false;
  this.rootCause = null;
  this._onProcessing = false;
}
/**
 * Static method for handler validation
 */
SvcHandlerMgrt.isValidHandler = function(handler) {
  if (! handler) return false;

  if (! handler.do || 
    !handler.getName || 
    !handler.undo ||
    !handler.doAsync ||
    !handler.undoAsync) return false;

  if (!(typeof handler.do === 'function') || 
    !(typeof handler.getName === 'function') || 
    !(typeof handler.undo === 'function') ||
    !(typeof handler.doAsync === 'function') ||
    !(typeof handler.undoAsync === 'function')) 
    return false

  return true;
}

/**
 * Add a new handler to handler list
 * 
 * @param {Object}, <Handler>
 */
SvcHandlerMgrt.prototype.addHandler = function(handler) {
  if (! SvcHandlerMgrt.isValidHandler(handler)) {
    throw new Error('Invalid Handler: ', handler);
  }

  this.handlers.push(handler);
}

/**
 * Remove handler to handler list
 * 
 * @param {Object}, <Handler|string|number>
 */
SvcHandlerMgrt.prototype.removeHandler = function(handler) {
  var expectedKey = null;
  if ('string' === typeof handler || 'number === typeof handler') {
    expectedKey = handler;
  } else {
    if (! SvcHandlerMgrt.isValidHandler(handler)) {
      throw new Error('Invalid Handler: ', handler);
    }

    expectedKey = handler.getName();
  }

  for (var i= this.handlers.length; i >=0; i--) {
    if (this.handlers[i].getName() === expectedKey) {
      this.handlers.splice(i, 1);
    }
  }
}

/**
 * Tell whether has next handler in handler list
 *
 * @return {Boolean}, true|false
 */
SvcHandlerMgrt.prototype.hasNext = function() {
  if (this.cursor >= this.handlers.length-1) return false;

  return true;
}

/**
 * Get next handler in handler list
 *
 * @return {Handler}, the next handler in handler queue
 */
SvcHandlerMgrt.prototype.next = function() {
  if (! this.hasNext()) return null;

  ++this.cursor;
  return this.handlers[this.cursor];
}

/**
 * Tell whether has previous handler in handler list
 *
 * @return {Boolean}, true|false
 */
SvcHandlerMgrt.prototype.hasPrevious = function() {
  if (this.cursor <= 0) return false;

  return true;
}

/**
 * Get previous handler in handler list
 *
 * @return {Handler}, the next handler in handler queue
 */
SvcHandlerMgrt.prototype.previous = function() {
  if (! this.hasPrevious()) return null;
  
  --this.cursor;
  return this.handlers[this.cursor];
}

/**
 * Get current handler in handler list
 *
 * @return {Handler}, the next handler in handler queue
 */
SvcHandlerMgrt.prototype.current = function() {
  return this.handlers[this.cursor];
}


/**
 * Process the handlers synchronously
 *
 * @return {object}, the result of processing
 */
SvcHandlerMgrt.prototype.process = function(context) {

  var currentHandler = null;

  try {
    while (this.hasNext()) {
      currentHandler = this.next();
      currentHandler.do();
    }
  } catch(error) {
    debug('Error occurs for handler ' + currentHandler.getName() +  ' execution, due to: ', error);
    currentHandler.undo();
    while (this.hasPrevious()) {
      currentHandler = this.previous();
      currentHandler.undo();
    }

    throw error;
  }
}

/**
 * Internal method which call by each handler for the handler execution navigation
 * @prviate
 */
SvcHandlerMgrt.prototype._done = function(error) {
  var _self = this;

  if (error || _self.continueOnError) {
    
    if (! this.continueOnError) {
      this.rootCause = error;
      this.continueOnError = true;
      debug('Error occurs for handler ' + _self.current().getName() +  ' execution, due to: ', error);
      _self.current().undoAsync(_self._done.bind(_self));
      return;
    }
    
    if (_self.hasPrevious()) {
      _self.previous().undoAsync(_self._done.bind(_self));
      return;
    } 
    this._onProcessing = false;
    _self.deferred.reject(_self.rootCause);
    return;
  }


  if (_self.hasNext()) {
    _self.next().doAsync(_self._done.bind(_self));
    return;
  } 
  
  this._onProcessing = false;
  _self.deferred.resolve(); 
}

// timeout to 120 mins
var ASYNC_TIMEOUT = 120*60*1000;

/**
 * Process the handlers asynchronously
 *
 * @return {promise}, the result of processing
 */
SvcHandlerMgrt.prototype.processAsync = function(context, timeout, callback) {
  var _self = this;
  if (timeout && 'function' === typeof timeout) {
    callback = timeout;
    timeout = null;
  }
  
  _self.deferred = Q.defer();
  // set default promise timeout
  if (! timeout) {
    timeout = ASYNC_TIMEOUT;
  }
  _self.deferred.promise.timeout(timeout);

  if (_self.hasNext()){
    this._onProcessing = true;
    _self.next().doAsync(_self._done.bind(_self));
  } else {
    _self.deferred.reject(new Error('No handler registered!'));
  }

  return _self.deferred.promise.nodeify(callback);
};

SvcHandlerMgrt.prototype.getHandlers = function() {
  return this.handlers;
};

SvcHandlerMgrt.prototype.isOngoing = function() {
  return this._onProcessing;
};

module.exports = exports = SvcHandlerMgrt;
