define(function(require, exports, module) {
  const koru           = require('koru');
  const Dom            = require('koru/dom');
  const Val            = require('koru/model/validation');
  const util           = require('koru/util');
  const ResourceString = require('resource-string');

  const Tpl = module.exports = Dom.newTemplate(module, require('koru/html!./flash'));
  const {Message} = Tpl;

  const close = elm =>{
    const flash = elm.parentNode;
    Dom.hideAndRemove(elm);
    if (! flash.querySelector('.m:not(.remElm)'))
      Dom.hideAndRemove(flash);
  };

  const display = ({message, transient, type='notice'})=>{
    message = ResourceString.text(message);
    let flash = document.getElementById('Flash');
    if (flash) {

      Dom.removeClass(flash, 'remElm');

      Dom.forEach(flash, '#Flash>.m.transient:not(.remElm)',
                  elm => {Dom.hideAndRemove(elm)});
    } else {
      flash = Tpl.$autoRender();
      document.body.appendChild(flash);
    }

    const classes = `m ${type}${transient ? ' transient' : ''}`;
    const elm = Message.$autoRender({classes, message});
    const ctx = Dom.myCtx(elm);
    flash.appendChild(elm);
    transient && ctx.onDestroy(koru.afTimeout(() => {close(elm)}, 7000));
    return elm;
  };

  Tpl.$events({
    'click .m'(event) {
      Dom.stopEvent();
      close(this);
    },
  });

  util.merge(Tpl, {
    close,
    error(message) {
      return display({message, type: 'error', transient: true});
    },

    notice(message) {
      return display({message, transient: true});
    },

    confirm(message) {
      return display({message, transient: false});
    },
  });

  koru.unexpectedError = (userMsg, logMsg)=>{
    Tpl.error('unexpected_error:'+(userMsg||logMsg));
    koru.error('Unexpected error', (logMsg||userMsg));
  };


  koru.globalErrorCatch = koru.globalCallback = e =>{
    if (! e) return;
    if (koru._TEST_ !== undefined && (e instanceof Error))
      koru.error(util.extractError(e));
    let reason = e.reason || e.toString();
    if (typeof reason === 'object') {
      try {
        reason = Val.Error.toString(reason);
      } catch(ex) {
        reason = util.inspect(reason);
      }
      reason = `Update failed: ${reason}`;
    }
    if (typeof e.error !== "number" || e.error >= 500) {
      e.stack && koru.error(util.extractError(e));
      Tpl.error(reason);
    } else {
      koru._TEST_ !== undefined &&
        e.stack && koru.error(util.extractError(e));
      Tpl.notice(reason);
    }
    return true;
  };
});
