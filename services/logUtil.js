/**
 * Loger util
 *
 * @module utils/logger
 */

var log4js = require('log4js');
var process = require('process');
var level = 'info';

log4js.configure(process.cwd() + '/config/log4js.json', {});

process.argv.forEach(
  function (arg) {
    var logKey = "--log-level=";
    if (arg.indexOf(logKey) > -1) {
      var argLevel = arg.substring(logKey.length, arg.length).trim();
      var validLevel = log4js.levels.toLevel(argLevel);
      if (validLevel) {
        level = validLevel;
      }
    }
  }
);

/**
 * Create a logger
 *
 * @function
 * @param {String} loggerName - the name of the new logger
 * @return {Logger} a logger
 *
 */
exports.getLogger = function getLogger(loggerName) {
  var logger = log4js.getLogger('[' + process.pid + ']' + loggerName);
  logger.setLevel(level);
  logger.flowDebug = function(msg) {
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg);
    }
    this.debug('[flow] ' + msg);
  };
  logger.flowInfo = function(msg) {
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg);
    }
    this.info('[flow] ' + msg);
  };
  logger.flowError = function(msg) {
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg);
    }
    this.error('[flow] ' + msg);
  };
  return logger;
};

/**
 * Set logger level
 *
 * @function
 * @param {String} logLevel - the log level, default level is info
 *
 */
exports.setLevel = function setLevel(logLevel) {
  level = logLevel;
};

/**
 * Get logger level
 *
 * @function
 * @return {String} logLevel - the log level
 *
 */
exports.getLevel = function () {
  return level;
};

/**
 * Get valid logger level
 *
 * @function
 * @param {String} logLevel - expected log level
 * @return {String/undefined} a valid log4js log level / undefined
 *
 */
exports.getValidLevel = function getValidLevel(argLevel) {
  return log4js.levels.toLevel(argLevel);
};