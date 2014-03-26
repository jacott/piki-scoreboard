var Tpl = Bart.Main;

var orgSub, orgShortName, pathname;

AppRoute.title = 'Piki';
App.org = function () {
  return App.orgId && AppModel.Org.findOne(App.orgId);
};

App._startup = function () {
  App.Ready.setNotReady();

  document.head.appendChild(Tpl.Head.$render({}));

  pathname = AppClient.getLocation();

  var handle = App.Ready.onReady(whenReady);
  var header = Tpl.Header.$autoRender({});
  document.body.insertBefore(header, document.body.firstChild);

  App.subscribe('Session', function (err) {
    Bart.removeId('Flash');
    if (err) return;
    App.Ready.notifyReady();
    subscribeOrg(orgShortName);
  });
  Bart.Flash.loading();

  function whenReady() {
    handle && handle.stop();
    handle = null;

    window.addEventListener('popstate', function (event) {
      App.Ready.isReady && AppRoute.pageChanged();
    });
    AppRoute.replacePath(pathname || document.location);
    return false;
  }

  AppModel.User.Index.observe(function (user) {
    if (user && user._id === App.userId())
      setAccess();
  });

  var userId = undefined;

  Deps.autorun(function () {
    var connected = Meteor.status().connected;

    var newUserId = Meteor.userId();

    if (Accounts.loginServicesConfigured() && connected) {
      Deps.nonreactive(function stateChange() {
        if (userId !== newUserId) {
          userId = newUserId;
          Bart.getCtx(header).updateAllTags();
          setAccess();
        }
      });
    }
  });
};

Tpl.Header.$helpers({
  orgHomeLinkText: function () {
    var org = App.org();
    if (org) return org.name;
    return 'Choose Organization';
  },
});

Tpl.Header.$events({
  'click [name=help]': function (event) {
    Bart.stopEvent();
    Bart.Dialog.open(Bart.Help.$autoRender({}));
  },
});

Tpl.setAccess = setAccess;

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

function setAccess() {
  var _id = App.userId();
  var user = _id && AppModel.User.quickFind(_id);
  Bart.setClassBySuffix(user ? user.accessClasses(App.orgId) : 'readOnly', 'Access', document.body);
}

function subscribeOrg(shortName) {
  setAccess();
  orgSub && orgSub.stop();
  if (shortName) {
    orgShortName = shortName;
    App.orgId = null;

    if (! App.Ready.isReady) return;

    orgSub = App.subscribe('Org', orgShortName, function () {

      Bart.removeId('Flash');
      var doc = AppModel.Org.findOne({shortName: orgShortName});
      if (! doc) {
        subscribeOrg();
        return;
      }
      App.orgId = doc._id;
      setAccess();
      Bart.addClass(document.body, 'inOrg');
      var orgLink = document.getElementById('OrgHomeLink');
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
    var orgLink = document.getElementById('OrgHomeLink');
    if (orgLink) orgLink.textContent = "Choose Organization";
  }
}
