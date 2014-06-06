define(function(require, exports, module) {
  var env =       require('koru/env');
  var User =      require('models/user');
  var Dom =       require('koru/dom');
  var header =    require('ui/header');
  var Org =       require('models/org');
  var Route =     require('koru/ui/route');
  var Flash =     require('ui/flash');
                  require('./home');
                  require('publish/publish-self');
                  require('publish/publish-org');
                  require('publish/publish-event');
  var Spinner =   require('ui/spinner');
  var util =      require('koru/util');
  var App =       require('./app-base');

  var selfSub, orgSub, orgShortName, pathname;

  util.extend(App, {
    subscribe: require('koru/session/subscribe'),

    stop: function () {
      orgSub && orgSub.stop();
      selfSub && selfSub.stop();
      selfSub = orgSub = orgShortName = pathname = null;

      window.removeEventListener('popstate', pageChanged);
    },

    start: function () {
      App.stop();
      Spinner.init();
      pathname = [env.getLocation()];
      App.setAccess();
      selfSub = App.subscribe('Self', function (err) {
        Dom.removeClass(document.body, 'loading');
        window.addEventListener('popstate', pageChanged);
        pathname && Route.replacePath(pathname[0] || document.location, pathname[1]);
      });
      header.show();
    },

    _setOrgShortName: function (value) {
      orgShortName = value;
    }
  });

  env.onunload(module, App.stop);

  Route.root.routeVar = 'orgSN';
  Route.root.onBaseEntry = function (page, pageRoute) {
    if (pageRoute.orgSN !== orgShortName) {
      subscribeOrg(pageRoute.orgSN);
    }
  };

  Route.root.onBaseExit = function () {
    subscribeOrg(null);
  };

  function pageChanged(event) {
    Route.pageChanged();
  }

  function subscribeOrg(shortName) {
    App.setAccess();
    orgSub && orgSub.stop();
    if (shortName) {
      orgShortName = shortName;
      App.orgId = null;

      orgSub = App.subscribe('Org', orgShortName, function (err) {
        Dom.removeId('Flash');
        if (err) {
          Dom.globalErrorCatch(err);
          subscribeOrg();
          return;
        }
        var doc = Org.findByField('shortName', orgShortName);
        if (! doc) {
          subscribeOrg();
          return;
        }
        App.orgId = doc._id;
        App.setAccess();
        Dom.addClass(document.body, 'inOrg');
        var orgLink = document.getElementById('OrgHomeLink');
        if (orgLink) orgLink.textContent = doc.name;
        if (pathname) {
          var pn = pathname;
          pathname = null;
          Route.replacePath(pn[0], pn[1]);
        }
      });

      Flash.loading();

      if (Route.loadingArgs) {
        pathname = Route.loadingArgs;
        Route.abortPage();
      }

    } else {
      orgSub = orgShortName = App.orgId = pathname = null;
      Dom.removeClass(document.body, 'inOrg');
      var orgLink = document.getElementById('OrgHomeLink');
      if (orgLink) orgLink.textContent = "Choose Organization";
    }
  }

  return App;
});
