define((require, exports, module)=>{
  'use strict';
  const SWManager       = require('koru/client/sw-manager');
  const Session         = require('koru/session');
  const KoruStartup     = require('koru/startup-client');
  require('koru/ui/helpers');
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
  const NewVersion      = require('ui/new-version');

  require('ui/profile');
  require('ui/reg-upload');
  require('ui/reset-password');
  require('ui/series');
  require('ui/sign-in');
  require('ui/team');
  require('ui/team-results');


  UserAccount.mode = 'srp';

  KoruStartup.restartOnUnload(require, module);

  return KoruStartup.startStop(
    UserAccount,
    Session,
    IDB,
    NewVersion,
    SWManager,
    App,
    Loading
  );
});
