define(function(require, exports, module) {
  var koru = require('koru');
  var session = require('koru/session');
  var Dom = require('koru/dom');
  var sessState = require('koru/session/state');

  var onChangeHandle;

  koru.onunload(module, stop);

  exports.init = function () {
    onChangeHandle = sessState.pending.onChange(function (pending) {
      Dom.setClass('show', pending, document.getElementById('Spinner'));
    });

    window.addEventListener('beforeunload', confirmLeave);
  };

  exports.stop = stop;

  function stop() {
    onChangeHandle && onChangeHandle.stop();
    onChangeHandle = null;

    window.removeEventListener('beforeunload', confirmLeave);
  }

  function confirmLeave(ev) {
    if (session.isRpcPending())
      ev.returnValue = "You have unsaved changes.";
  }
});
