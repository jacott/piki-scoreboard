define(function(require, exports, module) {
  const koruTH =    require('koru/ui/test-helper');
  const util =      require('koru/util');
  const Dom =       require('koru/dom');
  const Route =     require('koru/ui/route');
  const koru =       require('koru');
  const App =       require('./app');
  const Home =      require('ui/home');
  const TH =        require('test-helper');
  require('koru/ui/helpers');

  koru.onunload(module, 'reload');

  exports = module.exports = util.reverseExtend({
    setOrg: function (org) {
      org = org || exports.Factory.createOrg();
      App.orgId = org._id;
      Dom.addClass(document.body, 'inOrg');
      App._setOrgShortName(org.shortName);

      Route.replacePage(Home, {orgSN: org.shortName});
    },

    tearDown: function () {
      Route.replacePage();
      exports.domTearDown();
      exports.clearDB();
      util.thread.userId = null;
    },
  }, TH);

  exports.setAccess = App.setAccess, // used by TH.loginAs


  util.reverseExtend(exports, koruTH);
});
