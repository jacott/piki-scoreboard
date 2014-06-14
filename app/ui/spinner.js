define(function(require, exports, module) {
  var env = require('koru/env');
  var session = require('koru/session');
  var Dom = require('koru/dom');
  var sync = require('koru/session/sync');

  var onChangeHandle;

  env.onunload(module, stop);

  exports.init = function () {
    onChangeHandle = sync.onChange(function (show) {
      Dom.setClass('show', show, document.getElementById('Spinner'));
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
    if (sync.waiting())
      ev.returnValue = "You have unsaved changes.";
  }
});
