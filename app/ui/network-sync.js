define(function(require, exports, module) {
  const koru      = require('koru');
  const Dom       = require('koru/dom');
  const session   = require('koru/session');
  const util      = require('koru/util');
  const NotifyBar = require('ui/notify-bar');

  const Tpl = Dom.newTemplate(module, require('koru/html!./network-sync'));
  const $ = Dom.current;

  const DESCRIPTION = {
    offline: 'Offline',
    failure: 'Connection lost',
    pending: 'Waiting for response',
  };

  const data = {mode: 'online'};
  let elm, ctx;
  let stopListen, stopTimeout;

  koru.onunload(module, stop);

  Tpl.$extend({
    $created(_ctx, _elm) {
      Dom.removeId('NetworkSync');
      ctx = _ctx; elm = _elm;
      ctx.data = data;
    },

    get mode() {return data.mode;},
    set mode(value) {
      if (value === data.mode)
        return;
      data.mode = value;

      Dom.setClass('show', value !== 'online', elm);
      elm.setAttribute('name', data.mode);
      elm.setAttribute('title', DESCRIPTION[data.mode]);
      NotifyBar.change();
    },

    start() {
      NotifyBar.notify(Tpl.$autoRender());
      stopListen = session.state.onChange(open => {
        if (open) online();
        else
          stopTimeout || (stopTimeout = koru.afTimeout(disconnected, 2000));
      }).stop;
    },
    stop,
  });

  function disconnected() {
    stopTimeout = null;
    Tpl.mode = 'failure';
  }

  function online() {
    stopTimeout && stopTimeout();
    stopTimeout = null;
    Tpl.mode = 'online';
  }


  function stop() {
    Dom.remove(elm);
    stopTimeout && stopTimeout();
    stopListen && stopListen();
    stopListen = stopTimeout = null;
  }

  return Tpl;
});
