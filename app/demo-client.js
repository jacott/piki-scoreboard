define(function(require, exports, module) {
  const CssLoader = require('koru/css/loader');
  const session   = require('koru/session');

  new CssLoader(session).loadAll('ui');
  // var Trace = require('koru/trace');

  // Trace.debug_page(true);
  // Trace.debug_subscribe(true);
  // Trace.debug_clientUpdate({User: true, Org: true, Invite: true});
});
