/*
 *  Dislock is a distributed lock basedon redlock.
 *
 Redlock.prototype.lock(resource, ttl, ?callback) => Promise<Lock>
 resource (string) resource to be locked
 ttl (number) time in ms until the lock expires
 callback (function) callback returning:
 err (Error)
 lock (Lock)

 Redlock.prototype.unlock(lock, ?callback) => Promise
 lock (Lock) lock to be released
 callback (function) callback returning:
 err (Error)

 Redlock.prototype.extend(lock, ttl, ?callback) => Promise<Lock>
 lock (Lock) lock to be extended
 ttl (number) time in ms to extend the lock's expiration
 callback (function) callback returning:
 err (Error)
 lock (Lock)

 Redlock.prototype.disposer(resource, ttl, ?unlockErrorHandler)
 resource (string) resource to be locked
 ttl (number) time in ms to extend the lock's expiration
 callback (function) error handler called with:
 err (Error)

 Redlock.prototype.quit(?callback) => Promise<*[]>
 callback (function) error handler called with:
 err (Error)
 *[] results of calling .quit() on each client

 Lock.prototype.unlock(?callback) => Promise
 callback (function) callback returning:
 err (Error)

 Lock.prototype.extend(ttl, ?callback) => Promise<Lock>
 ttl (number) time from now in ms to set as the lock's new expiration
 callback (function) callback returning:
 err (Error)
 lock (Lock)
 *
 */

'use strict'
let logger                = require('./logUtil').getLogger('chanquan:service:dislock');
let Redlock               = require('redlock');
let redis                 = require('redis');

let Q                    = require('q');

class Dislock {
  constructor(redisList, options){
    this.options = options || {
        // the expected clock drift; for more details
        // see http://redis.io/topics/distlock
        driftFactor: 0.01, // time in ms

        // the max number of times Redlock will attempt
        // to lock a resource before erroring
        retryCount:  10,

        // the time in ms between attempts
        retryDelay:  200, // time in ms

        // the max time in ms randomly added to retries
        // to improve performance under high contention
        // see https://www.awsarchitectureblog.com/2015/03/backoff.html
        retryJitter:  200 // time in ms
      };

    this.redlock = new Redlock(redisList, this.options);
    this.redlock.on('clientError', function(err) {
      logger.error('A redis error has occurred:', err);
    });
  }

  /*
   resource (string) resource to be locked
   ttl (number) time in ms until the lock expires
   return Promise(Lock)
 */
  lock(resource, ttl){
    return this.redlock.lock(resource, ttl);
  }

  unlock(lock){
    return this.redlock.unlock(lock);
  }

  extend(lock, ttl){
    return this.redlock.extend(lock, ttl);
  }

  quit(){
    return this.redlock.quit();
  }

}

module.exports = exports = Dislock;