define(function(require, exports, module) {
  const sessionBase = require('koru/session/base').__initBase__('dev');
  const sessState   = require('koru/session/state').__init__();

  const session     = require('koru/session/main-client').__init__(sessState)(sessionBase);
  const cssLoader   = require('koru/css/loader')(session);

  cssLoader.loadAll('ui');
  session.connect();
  // var Trace = require('koru/trace');

  // Trace.debug_page(true);
  // Trace.debug_subscribe(true);
  // Trace.debug_clientUpdate({User: true, Org: true, Invite: true});
});
