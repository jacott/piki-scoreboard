define(function(require, exports, module) {
  const koru = require('koru');
  const Dom  = require('koru/dom');
  const util = require('koru/util');

  var Tpl = Dom.newTemplate(require('koru/html!./flash'));

  Tpl.$events({
    'click .m'(event) {
      Dom.stopEvent();
      Dom.hideAndRemove(event.currentTarget);
    },
  });

  util.extend(Tpl, {
    $created(ctx, elm) {
      ctx.onDestroy(koru.afTimeout(function () {
        Dom.hideAndRemove(elm);
      }, 7000));
    },
    error(message) {
      return this.notice(message, 'error');
    },

    notice(message, classes) {
      Dom.removeId('Flash');
      document.body.appendChild(Tpl.$autoRender({message: message, classes: classes || 'notice'}));
    },

    loading() {
      this.notice('Loading...', 'loading');
    }
  });

  koru.globalErrorCatch = function (e) {
    koru.error(e.error < 500 ? e : util.extractError(e));
    Tpl.error(e.reason || "Unexpected error");
    return true;
  };

  return Tpl;
});
