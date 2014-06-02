define(function(require, exports, module) {
  var Dom = require('koru/dom');
  var util = require('koru/util');

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
    Tpl.error(e.reason);
    return true;
  };

  return Tpl;
});
