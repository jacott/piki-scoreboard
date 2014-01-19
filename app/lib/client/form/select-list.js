var $ = Bart.current;

Bart.Form.SelectList = {
  attach: function (template, options) {
    var list = template.List;
    template.$events({
      'focus': openList,
      'mousedown': openList,
    });

    var events = {};

    events['mousedown ' + (options.selector || 'li')] = actionItem(options.onChoose);
    list.$events(events);

    events = null;

    function openList(event) {
      var ctx = $.ctx;

      if (ctx.listElm) {
        if (event.type === 'mousedown') Bart.remove(ctx.listElm);
      } else {
        var button = this;
        button.appendChild(ctx.listElm = list.$autoRender());
        var listCtx = Bart.getCtx(ctx.listElm);
        var callback = function (event) {
          if (event.type === 'mousedown' && Bart.parentOf(button, event.target)) return;

          Bart.remove(ctx.listElm);
        };
        button.addEventListener('blur', callback, true);
        document.addEventListener('mousedown', callback, true);
        listCtx.onDestroy(function () {
          ctx.listElm = null;
          button.removeEventListener('blur', callback, true);
          document.removeEventListener('mousedown', callback, true);
        });
      }
    }
  },
};

function actionItem(func) {
  return function (event) {
    event.$actioned = true;
    if (Bart.hasClass(this, 'disabled')) return;
    func(this, event);
  };
}

App.loaded('Bart.Form.SelectList', Bart.Form.SelectList);
