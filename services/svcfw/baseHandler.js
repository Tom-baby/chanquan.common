/**
 * Abstract class for  phased-hook handler implementation
 * 
 * For each specific handler, the 'getName' method is mandatory to be implemented. For others methods, 
 * either overwrite the methods or just delegate to this basic implementation.  
 *
 * @author lizh
 *  
 * @param {object} context
 */
var BaseHandler = function(context) {
  this.context = context;
};

/**
 * Get the handler name
 * 
 * @returns name
 */
BaseHandler.prototype.getName = function() {
  throw new Error('Unsupported method in abstract base abstract interceptor');
};

/**
 * Invoke for normal action synchronously
 */
BaseHandler.prototype.do = function(){
  // do nothing for abstract method
};

/**
 * Invoke for undo action synchronously
 */
BaseHandler.prototype.undo = function() {
  // do nothing for abstract method
};

/**
 * Invoke for normal action asynchronously
 * @param {function}, function(error), if error presented, do with error, otherwise, do successfully
 */
BaseHandler.prototype.doAsync = function(done){
  // do nothing for abstract method
  done();
};

/**
 * Invoke for undo action asynchronously
 * @param {function}, function(error), if error presented, undo with error, otherwise, undo successfully
 */
BaseHandler.prototype.undoAsync = function(done) {
  // do nothing for abstract method
  done();
};

/**
 * Check whether it is abstract function
 * @param methodName
 * @param function
 */
BaseHandler.isAbstractFunction = function(methodName, functionRef) {
  if (methodName !== 'getName' && 
    methodName !== 'do' &&
    methodName !== 'undo'&&
    methodName !== 'doAsync' &&
    methodName !== 'undoAsync' &&
    methodName !== 'cancel') {
    return false;
  }
  
  if (BaseHandler.prototype[methodName] === functionRef) {
    return true;
  }
  
  return false;
}

/**
 * Cancel handler execution
 */ 
BaseHandler.prototype.cancel = function() {
  this._cancel = true;
}

/**
 * Check is handler cancelled
 */ 
BaseHandler.prototype.isCancelled = function() {
  return this._cancel;
} 

module.exports = exports = BaseHandler;
