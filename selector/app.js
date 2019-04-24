/**
 * Created by zeqi
 * @description
 * @module
 * @version 1.0.0
 * @author Xijun Zhu <zhuzeqi2010@163.com>
 * @File app
 * @Date 17-2-16
 * @Wechat zhuzeqi2010
 * @QQ 304566647
 * @Office-email zhuxijun@b2cf.cn
 */

'use strict';

var logger               = require('../services/logUtil').getLogger('chanquan:common:selector:app');
var http = require('http');
var https = require('https');
var util = require('util');
var Q = require('q');
var DataHelper = require('../services/dataHelper').DataHelper;
var webAppHolder = require('../services/webAppHolder');

/**
 * App server class
 *
 * @class AppServer
 */
class AppServer {

  /**
   * Creates an instance of AppServer.
   *
   * @param name {string} server name
   * @param server {http.Server|https.Server}
   *
   * @memberOf AppServer
   */
  constructor(name, server) {
    this.name = name;
    this.server = server;
  }

  static get protocol() {
    return {
      http: 'http',
      https: 'https'
    };
  }

  /**
   * Just server
   * @param server {http.Server|https.Server}
   * @returns {boolean}
   */
  static isHttpOrHttpsServer(server) {
    if (!(server instanceof http.Server || server instanceof https.Server)) {
      return false;
    }
    return true;
  }

  isHttpOrHttpsServer(server) {
    return AppServer.isHttpOrHttpsServer(server);
  }

  set name(name) {
    if (name == undefined || name == null || name == NaN) {
      throw new Error('Server name invalid');
    }
    this._name = name;
  }

  get name() {
    return this._name;
  }

  set server(server) {
    if (!(server instanceof http.Server || server instanceof https.Server)) {
      throw new Error('Not HTTP or HTTPS server');
    }

    this._server = server;
  }

  get server() {
    return this._server;
  }
}

/**
 * App selector
 *
 * @class AppSelector
 */
class AppSelector {
  /**
   * Creates an instance of AppSelector.
   *
   * @param name {any} app selector name
   * @param servers {AppSelector.AppServer}
   * @param redisClent {object} redis client
   * @param dataService {object} data service
   * @param portalType: admin means admin portal; portal means the user portal
   * @memberOf AppSelector
   */
  constructor(name, servers, redisClent, dataService, portalType, standalone) {
    this.name = name;
    this.portalType = portalType;
    this.redisClient = redisClent;
    this.dataService = dataService;
    this.servers = servers;
    this.standalone = standalone;
    this.listener();
  }

  set name(name) {
    if (name == undefined || name == null || name == NaN) {
      throw new Error('Server name invalid');
    }
    this._name = name;
  }

  get name() {
    return this._name;
  }

  set redisClient(clent) {
    if (clent == undefined || clent == null || clent == NaN) {
      throw new Error('Redis client invalid');
    }
    this._redisClient = clent;
  }

  get redisClient() {
    return this._redisClient;
  }

  set dataService(dataService) {
    if (this.checkCacheDataService(dataService)) {
      this._dataService = dataService;
    }
  }

  get dataService() {
    return this._dataService;
  }

  checkDataService(dataService) {
    if (!dataService) {
      throw new Error('Data service invalid');
    }

    for (var item in dataService) {
      if (!(dataService[item] instanceof DataHelper)) {
        throw new Error(item + ' data service invalid');
      }
    }
    return true;
  }


  /**
   * Get app servers from servers
   * @param servers {AppSelector.AppServer}
   * @returns {boolean}
   */
  getAppServers(servers) {
    var self = this;
    if (!Array.isArray(servers)) {
      servers = [servers];
    }
    var appServers = [];
    servers.forEach(server=> {
      if (self.checkAppServers(server)) {
        appServers.push(server);
      }
    });
    return appServers;
  }

  static get AppServer() {
    return AppServer;
  }

  static get isHttpOrHttpsServer() {
    return AppServer.isHttpOrHttpsServer;
  }

  /**
   * Check servers is AppSelector.AppServer
   *
   * @param servers {AppSelector.AppServer}
   * @returns {boolean}
   *
   * @memberOf AppSelector
   */
  checkAppServers(servers) {
    var method = 'checkAppServers';
    if (!Array.isArray(servers)) {
      servers = [servers];
    }
    servers.forEach(server=> {
      if (!(server instanceof AppSelector.AppServer)) {
        logger.error(method, 'Not AppSelector.AppServer', server);
        return false;
      }
    });
    return true;
  }

  set servers(servers) {
    var self = this;
    if (!Array.isArray(servers)) {
      servers = [servers];
    }
    this.checkAppServers(servers);
    this._servers = servers;

    servers.forEach(appServer=> {
      if (appServer.server) {
        var apps = appServer.server.listeners('request').slice(0);
        if (Array.isArray(apps))
          webAppHolder.addApps(apps);
      }
    });
  }

  get servers() {
    return this._servers;
  }


  static getTenantAdminDomainCacheKey(domainName, port) {
    return 'tenant_adminDomain_' + domainName + '_' + port;
  }

  static getPortalUrlCacheKey(domainName, port, areaCode) {
    return 'portal_url_' + domainName + '_' + port + (areaCode ? ("_" + areaCode) : "");
  }

  static getAdminUrlCacheKey(domainName, port) {
    return 'tenant_adminDomain_' + domainName + '_' + port;
  }

  checkCacheDataService(dataService) {
    var self = this;
    var method = 'checkCacheService';
    var services = ['tenant', 'portal', 'organization', 'tnews', 'partner'];
    /*services.forEach(item=> {
     if (!dataService[item] || !(dataService[item] instanceof DataHelper)) {
     debug(method, '(process exit)', item, 'service invalid');
     throw new Error(item + ' data service invalid');
     }
     });*/

    if (!DataHelper.checkDataService(dataService, services)) {
      logger.error(method, '(process exit)', 'data service invalid');
      throw new Error('data service invalid');
    }
    return true;
  }

  cachePortalData(redisClient, dataService, domainName, port, areaCode, callback) {
    var self = this;
    var method = 'cachePortalData';
    try {
      self.checkCacheDataService(dataService);
      var tenantData = dataService.tenant;
      var portalData = dataService.portal;
      var organizationData = dataService.organization;
      var tnewsData = dataService.tnews;
      var partnerData = dataService.partner;
      var tprojectData = dataService.tproject;

      var portal_Url_Key = AppSelector.getPortalUrlCacheKey(domainName, port, areaCode);

      var result = {};
      let condition = {}
      if(self.standalone){
        condition = {
          'archived': false
        }
      }else{
        condition = {
          'portalDomain.domainName': domainName,
          'portalDomain.port': port,
          'archived': false
        }
      }
      return tenantData.getOneByCondition(condition, 'platform').then(data=> {
        if (!data || !data.code) {
          if(areaCode)
            throw {errorCode: 500, message: 'Not exists domainName:"' + domainName + ' and port:' + port + ' and areaCode:' + areaCode+'" in tenant'};
          else
            throw {errorCode: 500, message: 'Not exists domainName:"' + domainName + ' and port:' + port + '" in tenant'};
        }
        if (Array.isArray(data.adminDomain)) {
          data.adminDomain.forEach(item=> {
            if (item && item.domainName && item.port) {
              redisClient.set(AppSelector.getTenantAdminDomainCacheKey(item.domainName, item.port), JSON.stringify(data));
            }
          });
        }
        result.tenant = data;
        let tmpAreacode = areaCode;
        if(!areaCode && Array.isArray(data.portalDomain)){
          data.portalDomain.forEach(pd => {
            if(pd && pd.domainName == domainName && pd.port == port){
              tmpAreacode = pd.areaCode;
            }
          })
        }
        let condition = null;
        if(self.standalone){
          condition = {'archived': false};
        }else{
          condition = {'url.domainName': domainName, 'url.port': port + "", 'archived': false};
        }
        if(tmpAreacode){
          condition.areaCode = tmpAreacode
        }
        return portalData.getOneByCondition(condition, data.code);
      }).then(portal=> {
        if (!self.checkPortalInfo(portal)) {
          throw {
            errorCode: 500,
            message: 'Not exists domainName:"' + domainName + ' and port:' + port + '" in portal'
          };
        }

        if (result.tenant) {
          portal.repoDomain = result.tenant.repoDomain;
        }

        if(areaCode){
          portal.useAreaCode = true;
        }
        var promises = [];

        if (portal._id) {
          promises.push(partnerData.getData({
            condition: {$or:[{portalId: portal._id.toString()}, {"publishTo.portalId": portal._id.toString()}], archived: false},
            limit: 50,
            sort: {weight: -1}
          }, null, portal.tenantCode).then(partners=> {
            portal.partners = partners;
            return partners;
          }).fail(error=> {
            logger.error(method, '[Exit](failed)', error);
            return error;
          }));
        }

        if (portal.areaCode && portal.tenantCode) {
          promises.push(organizationData.getOneByCondition({code: portal.areaCode}, portal.tenantCode).then(organization=> {
            portal.areaCodeInfo = organization;
            if (!organization || !organization.code) {
              return organization;
            }

            var areaCodePromises = [];
            [{codeLen: 2, attr: 'province'}, {
              codeLen: 4, attr: 'city'
            }, {
              codeLen: 6, attr: 'district'
            }, {
              codeLen: 9, attr: 'town'
            }, {
              codeLen: 12, attr: 'village'
            }].forEach(item=> {
              if (organization.code.length < item.codeLen) {
                return false;
              }
              var areaCode = organization.code.substr(0, item.codeLen);
              areaCodePromises.push(organizationData.getOneByCondition({code: areaCode}, portal.tenantCode).then(data=> {
                organization[item.attr] = data;
                return data;
              }));
            });
            return Q.allSettled(areaCodePromises).then(all=> {
              portal.areaCodeInfo = organization;
              return portal;
            });
          }).fail(error=> {
            logger.error(method, '[Exit](failed)', error);
            return error;
          }));
        }

        return Q.allSettled(promises).then(all=> {
          return portal;
        });
      }).then(portal=> {
        return tnewsData.getData({
          condition: {level: 1, archived: false},
          limit: 20,
          sort: {order: 1}
        }, null, portal.tenantCode).then(data => {
          if (!Array.isArray(data)) {
            return false;
          }
          var tnewsQ = [];
          data.forEach(item=> {
            // if (item.parent) {
            //   var filter = {
            //     condition: {
            //       _id: item.parent.toString(),
            //       archived: false
            //     }
            //   };
            //   var options = {
            //     findOne: true
            //   };
            //   promises.push(tnewsData.getData(filter, options, portal.tenantCode).then(tnews=> {
            //     if (Array.isArray(tnews) && tnews.length > 0) {
            //       item.parentInfo = tnews[0];
            //     }
            //     return tnews;
            //   }).fail(error=> {
            //     debug(method, '[Error] get tnews error:', error);
            //     return error;
            //   }));
            // }
            if (item._id) {
              var subFilter = {
                condition: {
                  parent: item._id.toString(),
                  level: 2,
                  archived: false
                }
              };
              if(item.url == '/projects/transfer'){
                tnewsQ.push(tprojectData.getData({condition:{archived: false, $or:[{isTransfer:true},{isDemand:true}]}}, null, portal.tenantCode).then(tproject=> {
                  if (Array.isArray(tproject) && tproject.length > 0) {
                    item.subNavList = tproject;
                  }
                  return tproject;
                }).fail(error=> {
                  logger.error(method, '[Error] get tnews error:', error);
                  return error;
                }));
              }else{
                tnewsQ.push(tnewsData.getData(subFilter, null, portal.tenantCode).then(tnews=> {
                  if (Array.isArray(tnews) && tnews.length > 0) {
                    item.subNavList = tnews;
                  }
                  return tnews;
                }).fail(error=> {
                  logger.error(method, '[Error] get tnews error:', error);
                  return error;
                }));
              }
            }
          });
          return Q.allSettled(tnewsQ).then(all=> {
            portal.navbars = data;
            return portal;
          });
        });
      }).then(portal=> {
        redisClient.set(portal_Url_Key, JSON.stringify(portal));
        return portal;
      }).fail(error=> {
        logger.error(method, '[Error]', error);
        return Q.reject(error);
      }).nodeify(callback);
    }
    catch (error) {
      logger.error(method, '[Error]', error);
      return Q.reject(error);
    }
  }

  cacheAdminData(redisClient, dataService, domainName, port, callback) {
    var self = this;
    var method = 'cacheAdminData';
    try {
      self.checkDataService(dataService);
      var tenantData = dataService.tenant;

      var portal_Url_Key = AppSelector.getAdminUrlCacheKey(domainName, port);
      let condition = {}
      if(self.standalone){
        condition = {
          'archived': false
        }
      }else{
        condition = {
          'adminDomain.domainName': domainName,
          'adminDomain.port': port,
          'archived': false
        }
      }

      return tenantData.getOneByCondition(condition, 'platform').then(data=> {
        if (!data || !data.code) {
          throw {errorCode: 500, message: 'Not exists domainName:"' + domainName + ' and port:' + port + '" in tenant'};
        }
        if (Array.isArray(data.adminDomain)) {
          data.adminDomain.forEach(item=> {
            if (item && item.domainName && item.port) {
              redisClient.set(portal_Url_Key, JSON.stringify(data));
            }
          });
        }
        return data;
      }).nodeify(callback);
    }
    catch (error) {
      logger.error(method, '[Error]', error);
      return Q.reject(error);
    }
  }

  checkPortalInfo(portal) {
    if (this.portalType == 'admin')
      return this.checkAdminInfo(portal);
    else{
      if (!portal || !portal.tenantCode || !Array.isArray(portal.url)) {
        return false;
      }
    }
    return true;
  }

  checkAdminInfo(portal) {
    if (!portal || !portal.code) {
      return false;
    }
    return true;
  }

  getPortalFromRedisOrDataService(redisClient, dataService, domainName, port, portalType, areaCode, callback) {
    var self = this;
    var method = 'getPortalFromRedisOrDataService';
    var defer = Q.defer();
    try {
      var portal_Url_Key = "";
      if (portalType == 'admin') {
        portal_Url_Key = AppSelector.getAdminUrlCacheKey(domainName, port);
      } else {
        portal_Url_Key = AppSelector.getPortalUrlCacheKey(domainName, port, areaCode);
      }
      if (!redisClient || typeof redisClient.get != 'function') {
        throw {errorCode: 406, message: 'redis client invalid'};
      }
      redisClient.get(portal_Url_Key, function (err, reply) {
        if (err || !reply) {
          logger.error(method, 'Get portal info by key:' + portal_Url_Key + ' from redis error:', err, 'reply:', reply);
          if (portalType == 'admin') {
            return self.cacheAdminData(redisClient, dataService, domainName, port).then(data=> {
              return defer.resolve(data);
            }).fail(error=> {
              logger.error(method, '[Error]', error);
              return defer.reject(error);
            });
          } else {
            return self.cachePortalData(redisClient, dataService, domainName, port, areaCode).then(data=> {
              return defer.resolve(data);
            }).fail(error=> {
              logger.error(method, '[Error]', error);
              return defer.reject(error);
            });
          }
        }
        return defer.resolve(JSON.parse(reply));
      });
      return defer.promise.nodeify(callback);
    }
    catch (error) {
      logger.error(method, '[Error]', error);
      return defer.reject(error);
    }
  }

  getPortalUrlCacheKey(domainName, port, areaCode) {
    return AppSelector.getPortalUrlCacheKey(domainName, port, areaCode);
  }

  errorLogic(res, error) {
    res.writeHead(500, {
      'Content-Type': 'text/html'
    });
    res.write('<!doctype html>\n');
    res.write('<title>Internal Server Error</title>\n');
    res.write('<h1>Internal Server Error</h1>');
    res.write('<pre>' + util.inspect(error) + '</pre>');
    return res.end('ok');
  }

  loadAdminCfg(redisClient, dataService, tenantCode, areaCode, callback){
    var self = this;
    var method = 'loadAdminCfg';
    var defer = Q.defer();
    try {
      var adminCfg_Key = "admin_" + areaCode;

      if (!redisClient || typeof redisClient.get != 'function') {
        throw {errorCode: 406, message: 'redis client invalid'};
      }
      redisClient.get(adminCfg_Key, function (err, reply) {
        if (err || !reply) {
          logger.error(method, tenantCode, 'Get admin cfg by key:' + adminCfg_Key + ' from redis error:', err, 'reply:', reply);

          var adminData = dataService.admin;
          adminData.getOneByCondition({
            'areaCode': areaCode
          }, tenantCode).then(data=> {
            if(data){
              redisClient.set(adminCfg_Key, JSON.stringify(data));
              return defer.resolve(data);
            } else {
              adminData.getOneByCondition({}, tenantCode).then(data=> {
                if(data){
                  redisClient.set(adminCfg_Key, JSON.stringify(data));
                  return defer.resolve(data);
                }
                else
                  return defer.resolve();
              })
            }
          })
        }else{
          return defer.resolve(JSON.parse(reply));
        }
      });
      return defer.promise.nodeify(callback);
    }
    catch (error) {
      logger.error(method, '[Error]', error);
      return defer.reject(error);
    }
  }

  /**
   * Select app for current request;
   * @private
   * @param req
   * @param res
   */
  selectApp(req, res) {
    var self = this;
    var method = 'selectApp';
    try {
      var protocol = AppSelector.AppServer.protocol.http;
      var server = null;
      if (req.client.ssl) {
        protocol = AppSelector.AppServer.protocol.https;
      }

      protocol = req.headers['x-forwarded-protocol'] || protocol;

      for (var i = 0; i < self.servers.length; i++) {
        var item = self.servers[i];
        if (item) {
          var strArr = item.name.split('_');
          if (strArr[strArr.length - 1] == protocol) {
            server = item.server;
            break;
          }
        }
      }

      var hostname = req.headers.host;
      if (req.headers['x-forwarded-host'])
        hostname = req.headers['x-forwarded-host'];
      if (typeof hostname != 'string') {
        throw {errorCode: 406, message: 'host invalid'}
      }

      var hostInfo = hostname.split(':');
      var domainName = hostInfo[0];
      var port = '80';
      if (hostInfo.length == 2) {
        port = hostInfo[1];
      } if (req.headers['x-forwarded-origin-port']){
        port = req.headers['x-forwarded-origin-port'];
      } else if (protocol == AppSelector.AppServer.protocol.https) {
        port = '443';
      }

      logger.debug(method, 'apps length:', webAppHolder.getAppList().length, 'protocol:', protocol, 'domainName:', domainName, 'port:', port, 'request url:', req.url);
      let areaCode = null;
      if(req.url.indexOf("pid=") > 0)
      {
        let url = req.url;
        let index = url.indexOf("pid=");
        areaCode = url.substring(index + 4, url.length);
        if(areaCode.indexOf("&") > 0)
        {
          areaCode = areaCode.substring(0, areaCode.indexOf("&"));
        }
      }
      var portalKey = AppSelector.getPortalUrlCacheKey(domainName, port, areaCode);

      self.getPortalFromRedisOrDataService(self.redisClient, self.dataService, domainName, port, self.portalType, areaCode).then(portal=> {
        if (!self.checkPortalInfo(portal)) {
          throw {
            errorCode: 500,
            message: 'protcol:' + protocol + 'domainName:' + domainName + 'and port:' + port + ' portal configuration invalid'
          };
        }

        req.portalInfo = portal;
        req.currentUrlInfo = {
          protocol: protocol,
          domainName: domainName,
          port: port
        };
        if(self.portalType == 'portal')
        {
          self.loadAdminCfg(self.redisClient, self.dataService, portal.tenantCode, portal.areaCode).then(admin => {
            req.adminInfo = admin;
            var currentApp = null;
            let apps = webAppHolder.getAppList();
            for (var i = 0; i < apps.length; i++) {
              if (typeof apps[i].accept == 'function' && apps[i].accept(domainName, port, portal)) {
                currentApp = apps[i];
                break;
              }
            }

            if (!currentApp) {
              currentApp = self.createApp(domainName, port, portal);
              webAppHolder.addApp(currentApp);
            }

            return currentApp.call(server, req, res);
          }).fail(error=> {
            logger.error(method, '[Error]:', error);
            return self.errorLogic(res, error);
          });
        }else{
          var currentApp = null;
          let apps = webAppHolder.getAppList();
          for (var i = 0; i < apps.length; i++) {
            if (typeof apps[i].accept == 'function' && apps[i].accept(domainName, port, portal)) {
              currentApp = apps[i];
              break;
            }
          }

          if (!currentApp) {
            currentApp = self.createApp(domainName, port, portal);
            webAppHolder.addApp(currentApp);
          }

          return currentApp.call(server, req, res);
        }

      }).fail(error=> {
        logger.error(method, '[Error]:', error);
        return self.errorLogic(res, error);
      });
    }
    catch (error) {
      logger.error(method, '[Error]', error);
      self.errorLogic(res, error);
      return error;
    }
  }

  /**
   * Init all http or https server and add listener event
   *
   *
   * @memberOf AppSelector
   */
  listener() {
    var self = this;
    self.servers.forEach(appServer=> {
      if (appServer.server) {
        appServer.server.removeAllListeners('request');
        // add request handler
        appServer.server.on('request', self.selectApp.bind(self));
      }
    });
  }

  createApp(domainName, port, portal) {
    throw new Error('Unimplemented method in abstract class');
  }
}

module.exports = AppSelector;