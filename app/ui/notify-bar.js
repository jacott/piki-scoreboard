define(function(require, exports, module) {
  const Dom  = require('koru/dom');
  const util = require('koru/util');

  const Tpl = Dom.newTemplate(module, require('koru/html!./notify-bar'));
  const $ = Dom.current;

  const body = Dom.h({div: ''});

  Tpl.$extend({
    $created(ctx, elm) {
      elm.appendChild(body);
      this.change(elm);
    },
    $destroyed(ctx, elm) {
      elm.removeChild(body);
    },
    notify(elm) {
      body.insertBefore(elm, body.firstElementChild);
      this.change();
    },

    change() {
      const elm = body.parentNode;
      elm && Dom.setClass('on', body.querySelector('#NotifyBar>div>.show'), elm);
    },
  });

  return Tpl;
});
