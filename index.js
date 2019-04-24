'use strict'

/**
 * Common modules
 */

//========================================
//        Bootstrap
//(execute tasks by order to ensure all initializater is done before start server)
//========================================
let bootstrap = require('./boot/bootstrap');
module.exports.bootstrap = bootstrap;

//========================================
//       Http Service
//========================================
let HttpService = require('./services/httpService');
let DataHelper = require('./services/dataHelper');
let SvcMgrt = require('./services/svcMgrt');

module.exports.HttpService = HttpService;
module.exports.DataHelper = DataHelper.DataHelper;
Object.assign(module.exports, SvcMgrt);

//========================================
//    Data dictionaries definition
//========================================
var dict = require('./dict');
Object.assign(module.exports, dict);

//========================================
//       Policy Router
//========================================
let PolicyHandler = require('./router/policyHandler');
let PolicyRouter = require('./router/policyRouter');
let TLSRestricter = require('./router/policies/tls');
let SSOTokenHandler = require('./router/policies/ssotoken');
let SimpleLogger = require('./router/policies/logger');
let BasicAuthHandler = require('./router/policies/basicauth');
let CORSPolicyHandler = require('./router/policies/cors');

module.exports.PolicyHandler = PolicyHandler;
module.exports.PolicyRouter = PolicyRouter;
module.exports.TLSRestricter = TLSRestricter;
module.exports.SSOTokenHandler = SSOTokenHandler;
module.exports.SimpleLogger = SimpleLogger;
module.exports.BasicAuthHandler = BasicAuthHandler;
module.exports.CORSPolicyHandler = CORSPolicyHandler;

let BaseCORSRouter = require('./router/cors');
module.exports.BaseCORSRouter = BaseCORSRouter;

//=======================================
//      Scheduler Service
//=======================================
let Scheduler = require('./services/scheduler');
module.exports.Scheduler = Scheduler.Scheduler;
module.exports.SchedulerTask = Scheduler.SchedulerTask;
module.exports.SchedulerTaskFactory = Scheduler.SchedulerTaskFactory;

//=========================================
//             DataSource
//=========================================
let DSRegistry = require('./datasource/dsRegistry');
let MongoDS = require('./datasource/mongoDS');
let RedisDS = require('./datasource/redisDS');

module.exports.DSRegistry = DSRegistry;
module.exports.MongoDS = MongoDS;

//=======================================
//      Service Handler Framework
//=======================================

let BaseHandler = require('./services/svcfw/baseHandler');
module.exports.BaseHandler = BaseHandler;
let SvcHandlerMgrt = require('./services/svcfw/svcHandlerMgrt');
module.exports.SvcHandlerMgrt = SvcHandlerMgrt;

//=======================================
//     CCAP Run In Seperate VM/Process 
//=======================================

let CCAP = require('./ipc/ipc_clients/ccap');
module.exports.CCAP = CCAP;

//=======================================
//      Message Module
//=======================================
var Message = require('./services/message');
Object.assign(module.exports, Message);

//=======================================
//      Selector Module
//=======================================
var Selector = require('./selector');
Object.assign(module.exports, Selector);

//=======================================
//      Handlers Processing Flow Framework
//=======================================

let Context = require('./services/handlerFw/context');
module.exports.Context = Context;
let PostRequestHandler = require('./services/handlerFw/postRequestHandler');
module.exports.PostRequestHandler = PostRequestHandler;
let PreRequestHandler = require('./services/handlerFw/preRequestHandler');
module.exports.PreRequestHandler = PreRequestHandler;
let RequestHandler = require('./services/handlerFw/requestHandler');
module.exports.RequestHandler = RequestHandler;
let requestHandlerService = require('./services/handlerFw/requestHandlerService');
module.exports.requestHandlerService = requestHandlerService;

let serviceHolder = require('./services/serviceHolder');
module.exports.serviceHolder = serviceHolder;

let webAppHolder = require('./services/webAppHolder');
module.exports.webAppHolder = webAppHolder;

let ZkClientProxy = require('./services/zkClientProxy');
module.exports.ZkClientProxy = ZkClientProxy;

let Dislock = require('./services/dislock');
module.exports.Dislock = Dislock;