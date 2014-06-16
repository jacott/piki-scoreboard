define(function(require, exports, module) {
  var koruTH =    require('koru/ui/test-helper');
  var util =      require('koru/util');
  var Dom =       require('koru/dom');
  var Route =     require('koru/ui/route');
  var koru =       require('koru');
  var App =       require('./app');
  var Home =      require('ui/home');
  var TH =        require('test-helper');

  require('test-helper');

  var geddon = TH.geddon;

  koru.onunload(module, 'reload');

  TH.setAccess = App.setAccess, // used by TH.loginAs

  TH = util.reverseExtend({
    setOrg: function (org) {
      org = org || TH.Factory.createOrg();
      App.orgId = org._id;
      Dom.addClass(document.body, 'inOrg');
      App._setOrgShortName(org.shortName);

      Route.replacePage(Home, {orgSN: org.shortName});
    },

    tearDown: function () {
      Route.replacePage();
      TH.domTearDown();
      TH.clearDB();
      util.thread.userId = null;
    },
  }, TH);

  return util.reverseExtend(TH, koruTH);
});
