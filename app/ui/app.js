define(function(require, exports, module) {
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const format          = require('koru/format');
  const session         = require('koru/session');
  const sessState       = require('koru/session/state');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const Org             = require('models/org');
  const User            = require('models/user');
  require('publish/publish-event');
  require('publish/publish-org');
  require('publish/publish-self');
  const ResourceString  = require('resource-string');
  const Flash           = require('ui/flash');
  const header          = require('ui/header');
  const Spinner         = require('ui/spinner');
  const App             = require('./app-base');
  const Disconnected    = require('./disconnected');
  require('./home');

  var selfSub, orgSub, orgShortName, pathname, sessStateChange;

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
      sessStateChange && sessStateChange.stop();
      selfSub = orgSub = orgShortName = pathname = null;

      window.removeEventListener('popstate', pageChanged);
    },

    start: function () {
      App.stop();
      sessStateChange = sessState.onChange(connectChange);
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

  function connectChange(state) {
    if (state)
      Dom.removeId('Disconnected');
    else
      document.body.appendChild(Disconnected.$autoRender({}));
  }

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
        var doc = Org.findBy('shortName', orgShortName);
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
