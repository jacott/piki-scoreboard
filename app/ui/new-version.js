define((require, exports, module) => {
  'use strict';
  const SWManager       = require('koru/client/sw-manager');
  const Session         = require('koru/session');
  const SessionBase     = require('koru/session/base').constructor;

  let swListener;
  const newVersion = {
    start: () => {
      if (swListener !== undefined) return;
      SessionBase.prototype.newVersion = async ({hash}) => {
        const lastVersion = window.sessionStorage.getItem('lastVersion');
        window.sessionStorage.removeItem('lastVersion');

        if (lastVersion === hash) {
          return;
        }
        window.sessionStorage.setItem('lastVersion', hash);
        await SWManager.update();
        await SWManager.prepareNewVersion(hash);
        SWManager.loadNewVersion();
      };
      swListener = SWManager.onUpdateWaiting(() => {SWManager.loadNewVersion()});
    },

    stop: () => {
      if (swListener === undefined) return;
      SessionBase.prototype.newVersion = undefined;
      swListener.stop(); swListener = undefined;
    },
  };

  return newVersion;
});
