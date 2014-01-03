var Tpl = Bart.Main;

document.head.appendChild(Tpl.Head.$render({}));

App.isReady = false;

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
};

Meteor.startup(App._startup);

AppRoute.onGotoPath(function (path) {
  return subscribeOrg(path);
});

var sessionSub;

function stateChange(opts) {
  if (sessionSub) {
    sessionSub.stop();
    sessionSub = null;
  }

  App.Ready.setNotReady();
  sessionSub = App.subscribe('Session', function (err) {
    if (err) return;
    App.Ready.notifyReady();
  });
}

var orgSub, orgShortName;

function subscribeOrg(path) {
  var m = /^\/([A-Z][A-Z0-9]{1,3})(?:\/(.*)|)$/.exec(path);

  if (m) {
    path = m[2] || '';
    if (m[1] === orgShortName) return path;
    orgShortName = m[1];
    m = null;
    orgSub && orgSub.stop();
    Tpl.id = null;
    orgSub = App.subscribe('Org', orgShortName, function () {
      var doc = AppModel.Org.findOne({shortName: orgShortName});
      Tpl.id = doc._id;
      var orgLink = document.getElementById('OrgHomeLink');
      orgLink.textContent = doc.name;
      Bart.getCtx(orgLink).data.link = '/'+orgShortName;
    });
    return path;
  } else {
    orgSub && orgSub.stop();
    orgSub = orgShortName = Tpl.id = null;
    var orgLink = document.getElementById('OrgHomeLink');
    if (orgLink) {
      orgLink.textContent = "Choose Organization";
      Bart.getCtx(orgLink).data.link = '/org/choose';
    }
    return path;
  }
}
