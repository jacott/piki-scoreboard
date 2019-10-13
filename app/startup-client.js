define((require, exports, module)=>{
  const client          = require('koru/client');
  const session         = require('koru/session');
  require('koru/ui/helpers');
  const Route           = require('koru/ui/route');
  const UserAccount     = require('koru/user-account');
  const IDB             = require('lib/idb');
  const App             = require('ui/app');
  require('ui/category');
  require('ui/choose-org');
  require('ui/climber');
  require('ui/event-category');
  require('ui/event-register');
  require('ui/help');
  const Loading         = require('ui/loading');

  require('ui/profile');
  require('ui/reg-upload');
  require('ui/reset-password');
  require('ui/series');
  require('ui/sign-in');
  require('ui/team');
  require('ui/team-results');

  let _extras = null;

  UserAccount.mode = 'srp';

  const start = extras =>{
    _extras = extras || _extras;
    if (_extras != null) {
      _extras.forEach(extra =>{module.get(extra).onUnload(restart)});
    }
    UserAccount.start();
    IDB.start().then(()=>{
      session.connect();
      App.start();
      Loading.start();
    });
  };

  const stop = ()=>{
    IDB.stop();
    App.stop();
    session.stop();
    UserAccount.stop();
  };

  const restart = (mod, error)=>{
    const {location} = window;
    const {href} = location;
    const {state} = window.history;
    Route.replacePage(null);
    stop();
    window.history.replaceState(state, '', href);
    if (error) return;
    window.requestAnimationFrame(()=>{require(mod.id, sc => sc.start && sc.start(_extras))});
  };

  module.onUnload(restart);

  return {
    start,
    stop,
  };
});
