var Tpl = Bart.Main;

document.head.appendChild(Tpl.Head.$render({}));

App.isReady = false;

App._startup = function () {
  document.body.appendChild(Tpl.$render({}));
  AppRoute.setByLocation();
  Deps.autorun(function () {
    if (Accounts.loginServicesConfigured() && Meteor.status().connected) {
      Meteor.userId();
      Deps.nonreactive(function () {stateChange()});
    }
  });
};

Meteor.startup(App._startup);

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
