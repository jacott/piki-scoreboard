define(function(require, exports, module) {
  const koru        = require('koru');
  const client      = require('koru/client');
  const session     = require('koru/session');
  require('koru/ui/helpers');
  const Route       = require('koru/ui/route');
  const userAccount = require('koru/user-account');
  const App         = require('ui/app');
  require('ui/category');
  require('ui/climber');
  require('ui/event-category');
  require('ui/event-register');
  require('ui/profile');
  require('ui/reg-upload');
  require('ui/reset-password');
  require('ui/series');
  require('ui/sign-in');
  require('ui/team');
  require('ui/team-results');
  require('ui/help');
  require('ui/choose-org');

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

  function restart(mod, error) {
    var location = window.location;
    var href = location.href;
    var state = window.history.state;
    Route.replacePage(null);
    stop();
    window.history.replaceState(state, '', href);
    if (error) return;
    var modId = mod.id;
    window.requestAnimationFrame(function () {
      require(modId, sc => sc.start && sc.start(_extras));
    });
  }

  return {
    start: start,

    stop: stop,
  };
});
