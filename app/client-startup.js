define(function(require, exports, module) {
  require('koru/user-account/client-main');
  var subscribe = require('koru/session/subscribe');
  var env = require('koru/env');
  var User = require('models/user');
  var Dom = require('koru/dom');
  var App = require('app');
  var header = require('ui/header');
  var Org = require('models/org');
  var Route = require('koru/ui/route');
  require('ui/home');
  var Flash = require('ui/flash');
  require('publish/client-publish-self');
  require('publish/client-publish-org');
  var Spinner = require('ui/spinner');

  var selfSub, orgSub, orgShortName, pathname;

  exports.stop = function () {
    orgSub && orgSub.stop();
    selfSub && selfSub.stop();
    selfSub = orgSub = orgShortName = pathname = null;

    window.removeEventListener('popstate', pageChanged);
  };

  exports.start = function () {
    exports.stop();
    Spinner.init();
    pathname = [env.getLocation()];
    setAccess();
    selfSub = subscribe('Self', function (err) {
      Dom.removeClass(document.body, 'loading');
      window.addEventListener('popstate', pageChanged);
      pathname && Route.replacePath(pathname[0] || document.location, pathname[1]);
    });
    header.show();
  };

  env.onunload(module, exports.stop);

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
    setAccess();
    orgSub && orgSub.stop();
    if (shortName) {
      orgShortName = shortName;
      App.orgId = null;

      orgSub = subscribe('Org', orgShortName, function (err) {
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
        setAccess();
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

  function setAccess() {
    var _id = env.userId();
    var user = _id && User.findById(_id);
    Dom.setClassBySuffix(user ? user.accessClasses(App.orgId) : 'readOnly', 'Access', document.body);
  }
});
