define(function(require, exports, module) {
  var koru =      require('koru');
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
  var session =   require('koru/session');
  var util =      require('koru/util');
  var App =       require('./app-base');
  var format =    require('koru/format');
  var ResourceString = require('resource-string');

  var selfSub, orgSub, orgShortName, pathname;

  koru.onunload(module, 'reload');

  util.extend(App, {
    text: function (text) {
      var m = /^([^:]+):(.*)$/.exec(text);
      if (m) {
        var fmt = ResourceString.en[m[1]];
        if (fmt) {
          return format(fmt, m[2].split(':'));
        }
      }
      return ResourceString.en[text] || text;
    },

    subscribe: require('koru/session/subscribe')(session),

    stop: function () {
      orgSub && orgSub.stop();
      selfSub && selfSub.stop();
      selfSub = orgSub = orgShortName = pathname = null;

      window.removeEventListener('popstate', pageChanged);
    },

    start: function () {
      App.stop();
      Spinner.init();
      pathname = [koru.getLocation()];
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
          koru.globalErrorCatch(err);
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
