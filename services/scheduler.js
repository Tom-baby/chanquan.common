'use strict'

/**
 * Scheduler utility class 
 *
 * @author lizh
 */
var logger  = require('./logUtil').getLogger('chanquan:common:services:scheduler');
var EventEmitter        = require('events');

/**
 * Abstract class for scheduler task implementation
 * 
 * For each specific task, the 'getName' and run methods are mandatory to be implemented.
 * It should provide 'start' and 'end' events, that will help Scheduler to make sure whether
 * it can launch a new task running after a interval 
 *  
 * @param {object} context
 */
class SchedulerTask extends EventEmitter {

	constructor (name) {
		super();
		this._name = name;	
	}

	/**
	 * 'start' event which will be triggered when the task is starting
	 */
	static get START_EVENT() {
		return 'task.start';	
	}

	/**
	 * 'end' event which will be triggered when the task is completed with a good execution result
	 */
	static get END_EVENT() {
		return 'task.end';	
	}

	/**
	 * 'failed' event which will be triggered if  the task is completed with an exception
	 */
	static get FAILED_EVENT() {
		return 'task.failed';	
	} 

	/**
	 * Get the task name
	 * 
	 * @returns name
	 */ 
	getName() {
		throw new Error('Unsupported method in base abstract task');
	}

	/**
	 * Task run
	 */
	run(){
		throw new Error('Unsupported method in base abstract task');
	}
}


/**
 * Abstract Scheduler task factory class
 */ 
class SchedulerTaskFactory  {
	constructor() {
	}

	/**
	 * Create a scheduler task 
	 * @param {SchedulerTask}, schedulerTask
	 */
	create() {
		throw new Error('Unsupported method in base abstract task factory');
	}
}

var DEFAULT_INTERVAL = 5 * 60 *1000; // 5 mins

/**
 * Scheduler class to present a scheduler , who will 
 * trigger the task reguarlly by the specfied interval
 * @param {SchedulerTask} task, the task who implement the scheduler interface
 * @param {number} interval,  
 */
class Scheduler extends EventEmitter {

	constructor (taskFactory, interval) {
		super();
		this._interval = (interval) ? interval : DEFAULT_INTERVAL;
		this.taskFactory = taskFactory;
		this.hasRunningTask = false;
		this._cancel = false;
	}

	/**
	 * 'start' event which will be triggered when the task is starting
	 */
	static get START_EVENT() {
		return 'start';	
	}

	/**
	 * 'end' event which will be triggered when the task is completed with a good execution result
	 */
	static get END_EVENT() {
		return 'end';	
	}

	/**
	 * 'failed' event which will be triggered if  the task is completed with an exception
	 */
	static get FAILED_EVENT() {
		return 'failed';	
	}

	/**
	 * scheduler start
	 */
	start () {
		var self = this;
		
		if (self._cancel) return;
		var task = self.taskFactory.create();
		self.currentTask = task;
   
		task.on(SchedulerTask.START_EVENT, function() {
			self.hasRunningTask = true;
			self.emit(Scheduler.START_EVENT);
		});
    
		task.on(SchedulerTask.FAILED_EVENT, function(error) {
			self.hasRunningTask = false;
			logger.error('The scheudler task ' + task.getName() + ' failed to execution, due to: ', error);
			self.emit(Scheduler.FAILED_EVENT, error);
			task.removeAllListeners();

			setTimeout(function() {
				self.start();
			}, self.getInterval());
		});

		task.on(SchedulerTask.END_EVENT, function(result) {
			self.hasRunningTask = false;
			logger.info('The scheudler task ' + task.getName() + ' execution is done with below result: ', result);
			self.emit(Scheduler.END_EVENT, result);
			task.removeAllListeners();
			setTimeout(function() {
				self.start();
			}, self.getInterval());

		});
		
		// run the task
		task.run();
	}

	setInterval(interval) {
		this._interval = interval;
	}

	getInterval () {
		return this._interval;
	}

	cancel() {
		this._cancel = true;
	}
}

module.exports = exports = {
	                           Scheduler: Scheduler,
                             SchedulerTaskFactory: SchedulerTaskFactory,
                             SchedulerTask: SchedulerTask
                           };
