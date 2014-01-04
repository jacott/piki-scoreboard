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
    subscribeOrg(orgShortName);
    App.Ready.notifyReady();
  });
}

var orgSub, orgShortName;

function subscribeOrg(shortName) {
  orgSub && orgSub.stop();
  if (shortName) {
    orgShortName = shortName;
    Tpl.id = null;
    orgSub = App.subscribe('Org', orgShortName, function () {
      var doc = AppModel.Org.findOne({shortName: orgShortName});
      Tpl.id = doc._id;
      Bart.addClass(document.body, 'inOrg');
      var orgLink = document.getElementById('OrgHomeLink');
      orgLink.textContent = doc.name;
      Bart.getCtx(orgLink).data.link = '/'+orgShortName;
    });
  } else {
    orgSub = orgShortName = Tpl.id = null;
    Bart.removeClass(document.body, 'inOrg');
    var orgLink = document.getElementById('OrgHomeLink');
    if (orgLink) {
      orgLink.textContent = "Choose Organization";
      Bart.getCtx(orgLink).data.link = '/org/choose';
    }
  }
}
