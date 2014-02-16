var Tpl = Bart.Main;

AppRoute.title = 'Piki';
App.org = function () {
  return AppModel.Org.findOne(App.orgId);
};

document.head.appendChild(Tpl.Head.$render({}));

App._startup = function () {
  pathname = document.location;
  var handle = App.Ready.onReady(whenReady);
  document.body.insertBefore(Tpl.Header.$render({}), document.body.firstChild);

  function whenReady() {
    handle && handle.stop();
    handle = null;

    AppRoute.gotoPath(pathname || document.location);
    return false;
  }

  Deps.autorun(function () {
    if (Accounts.loginServicesConfigured() && Meteor.status().connected) {
      Meteor.userId();
      Deps.nonreactive(function () {stateChange()});
    }
  });

  window.addEventListener('popstate', function (event) {
    App.Ready.isReady && AppRoute.pageChanged();
  });
};

Meteor.startup(App._startup);

AppRoute.root.routeVar = 'orgSN';
AppRoute.root.onBaseEntry = function (page, pageRoute) {
  if (pageRoute.orgSN !== orgShortName) {
    subscribeOrg(pageRoute.orgSN);
    if (pageRoute.orgSN) {
      pathname = pageRoute.pathname;
    }
  } else if (orgSub) {
    pathname = pageRoute.pathname;
  }
};

AppRoute.root.onBaseExit = function () {
  subscribeOrg(null);
};

var sessionSub;

function stateChange(opts) {
  if (sessionSub) {
    sessionSub.stop();
    sessionSub = null;
  }

  App.Ready.setNotReady();
  orgSub && orgSub.stop(); orgSub = null;
  sessionSub = App.subscribe('Session', function (err) {
    Bart.removeId('Flash');
    if (err) return;
    App.Ready.notifyReady();
    subscribeOrg(orgShortName);
  });
  Bart.Flash.loading();
}

var orgSub, orgShortName, pathname;

function subscribeOrg(shortName) {
  orgSub && orgSub.stop();
  var orgLink = document.getElementById('OrgHomeLink');
  if (shortName) {
    orgShortName = shortName;
    App.orgId = null;

    if (! App.Ready.isReady) return;

    orgSub = App.subscribe('Org', orgShortName, function () {
      Bart.removeId('Flash');
      var doc = AppModel.Org.findOne({shortName: orgShortName});
      if (! doc) {
        subscribeOrg();
        Bart.Flash.error('Organization not found');
        return;
      }
      App.orgId = doc._id;
      Bart.addClass(document.body, 'inOrg');
      if (orgLink) orgLink.textContent = doc.name;
      if (pathname) {
        var pn = pathname;
        pathname = null;
        AppRoute.replacePath(pn);
      }
    });

    Bart.Flash.loading();

    if (AppRoute.loadingArgs) {
      pathname = AppRoute.loadingArgs[1].pathname;
      AppRoute.abortPage();
    }

  } else {
    orgSub = orgShortName = App.orgId = pathname = null;
    Bart.removeClass(document.body, 'inOrg');
    if (orgLink) orgLink.textContent = "Choose Organization";
  }
}
