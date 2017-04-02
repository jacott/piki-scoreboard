isClient && define(function (require, exports, module) {
  const Dom = require('koru/dom');
  const TH  = require('ui/test-helper');

  const sut  = require('./notify-bar');
  var v;

  TH.testCase(module, {
    setUp() {
      v = {};
    },

    tearDown() {
      Dom.removeId('myNotification');
      TH.tearDown();
      v = null;
    },

    "test notify survives destory"() {
      const myNotification = Dom.h({id: 'myNotification'});
      const ctx = Dom.setCtx(myNotification);

      document.body.appendChild(sut.$autoRender());

      sut.notify(myNotification);

      assert.dom('#NotifyBar:not(.on) #myNotification');

      Dom.removeId('NotifyBar');
      Dom.addClass(myNotification, 'show');
      document.body.appendChild(sut.$autoRender());

      assert.dom('#NotifyBar.on #myNotification');
      assert.same(Dom.myCtx(myNotification), ctx);
    },

    "test change"() {
      document.body.appendChild(sut.$autoRender());
      assert.dom('#NotifyBar:not(.on)', elm => {
        const myElm = Dom.h({id: "myNotification", class: 'show'});
        sut.notify(myElm);
        assert.className(elm, 'on');
        Dom.removeClass(myElm, 'show');
        sut.change();
        refute.className(elm, 'on');
      });
    },
  });
});
