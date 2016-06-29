define(function(require, exports, module) {
  const koru = require('koru');
  const session = require('koru/session');
  const userAccount = require('koru/user-account');
  const client = require('koru/client');
  const App = require('ui/app');
  require('koru/ui/helpers');
  require('ui/profile');
  require('ui/club');
  require('ui/team');
  require('ui/climber');
  require('ui/category');
  require('ui/event-category');
  require('ui/event-register');
  require('ui/reg-upload');
  require('ui/reset-password');

  koru.onunload(module, restart);

  var _extras;

  function start(extras) {
    _extras = extras || _extras;
    if (_extras) {
      _extras.forEach(function (extra) {
        koru.onunload(module.get(extra), restart);
      });
    }
    userAccount.init();
    session.connect();
    App.start();
  }

  function stop() {
    App.stop();
    session.stop();
    userAccount.stop();
  }

  function restart(id, error) {
    var location = window.location;
    var href = location.href;
    var state = window.history.state;
    stop();
    window.history.replaceState(state, '', href);
    if (error) return;
    require([id], function () {
      start();
    });
  }

  return {
    start: start,

    stop: stop,
  };
});
