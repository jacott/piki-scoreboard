define(function(require, exports, module) {
  var Dom = require('koru/dom');
  var util = require('koru/util');
  var env = require('koru/env');

  var Tpl = Dom.newTemplate(require('koru/html!./flash'));

  Tpl.$events({
    'click .m': function (event) {
      Dom.stopEvent();
      Dom.remove(event.currentTarget);
    },
  });

  util.extend(Tpl, {
    error: function (message) {
      return this.notice(message, 'error');
    },

    notice: function (message, classes) {
      Dom.removeId('Flash');
      document.body.appendChild(Tpl.$autoRender({message: message, classes: classes || 'notice'}));
    },

    loading: function () {
      this.notice('Loading...', 'loading');
    }
  });


  Dom.globalErrorCatch = function (e) {
    env.error(e.stack);
    Tpl.error(e.reason || "Unexpected error");
    return true;
  };

  return Tpl;
});