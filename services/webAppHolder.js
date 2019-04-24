'use strict'

var logger  = require('./logUtil').getLogger('chanquan:common:services:webAppHolder');

class WebAppHolder {

  constructor() {
    this.appList = [];
  }

  removeApp(app) {
    for (let i = 0; i < this.appList.length; i++) {
      if (this.appList[i] == app) {
        this.appList.splice(i, 1);
        logger.info("app removed", app.allow_url);
        break;
      }
    }
  }

  addApp(app){
    this.appList.push(app);
    logger.info("app added", app.allow_url);
  }

  addApps(apps){
    this.appList.concat(apps);
  }

  getAppList(){
    return this.appList;
  }

}

let webAppHolder = new WebAppHolder();
module.exports = exports = webAppHolder;