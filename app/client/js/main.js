var Tpl = Bart.Main;

AppRoute.title = 'Piki';

document.head.appendChild(Tpl.Head.$render({}));

App._startup = function () {
  var handle = App.Ready.onReady(whenReady);
  document.body.insertBefore(Tpl.Header.$render({}), document.body.firstChild);

  function whenReady() {
    handle && handle.stop();
    handle = null;

    AppRoute.gotoPath(document.location);
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

AppRoute.onGotoPath(function (path) {
  var m = /^\/([A-Z][A-Z0-9]{1,3})(?:\/(.*)|)$/.exec(path);

  if (m) {
    path = m[2] || '';
    if (m[1] === orgShortName) return path;
    subscribeOrg(m[1]);
  } else {
    subscribeOrg(null);
  }
  return path;
});

var sessionSub;

function stateChange(opts) {
  if (sessionSub) {
    sessionSub.stop();
    sessionSub = null;
  }

  App.Ready.setNotReady();
  orgSub && orgSub.stop(); orgSub = null;
  sessionSub = App.subscribe('Session', function (err) {
    if (err) return;
    App.Ready.notifyReady();
    subscribeOrg(orgShortName);
  });
}

var orgSub, orgShortName;

function subscribeOrg(shortName) {
  orgSub && orgSub.stop();
  var orgLink = document.getElementById('OrgHomeLink');
  if (shortName) {
    AppRoute.pathPrefix = '/' + shortName;
    orgShortName = shortName;
    Tpl.id = null;

    if (! App.Ready.isReady) return;

    orgSub = App.subscribe('Org', orgShortName, function () {
      var doc = AppModel.Org.findOne({shortName: orgShortName});
      Tpl.id = doc._id;
      Bart.addClass(document.body, 'inOrg');
      if (orgLink) orgLink.textContent = doc.name;
    });
  } else {
    AppRoute.pathPrefix = null;
    orgSub = orgShortName = Tpl.id = null;
    Bart.removeClass(document.body, 'inOrg');
    if (orgLink) orgLink.textContent = "Choose Organization";
  }
}
