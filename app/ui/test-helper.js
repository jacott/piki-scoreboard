define((require, exports, module)=>{
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const localStorage    = require('koru/local-storage');
  require('koru/ui/helpers');
  const Route           = require('koru/ui/route');
  const KoruUITH        = require('koru/ui/test-helper');
  const util            = require('koru/util');
  const BaseTH          = require('test-helper');
  const Factory         = require('test/factory');
  const App             = require('ui/app');

  koru.onunload(module, 'reload');

  const TH = {
    __proto__: BaseTH,

    setOrg(org) {
      org = org || Factory.createOrg();
      App.orgId = org._id;
      localStorage.setItem('orgSN', org.shortName);
      Dom.addClass(document.body, 'inOrg');
    },

    tearDown(v) {
      TH.clearDB();
      TH.domTearDown();
      util.thread.userId = null;
    },

    addStyles(styles) {
      var style = Dom.h({style: '', class: "testStyle"});

      style.innerHTML = styles;
      document.head.appendChild(style);
    },

    pointer(node, eventName, args) {
      if (typeof node === 'string') {
        assert.elideFromStack.dom(node, elm =>{TH.pointer(elm, eventName, args)});
      } else {
        assert.elideFromStack(node,'node not found');
        if (typeof eventName === 'object') {
          args = eventName;
          eventName = 'pointermove';
        } else {
          eventName = eventName || 'pointermove';
          args = args || {};
        }
        var bbox = node.getBoundingClientRect();

        args.clientX = bbox.left + bbox.width/2;
        args.clientY = bbox.top + bbox.height/2;

        var event =  TH.buildEvent(eventName, args);

        if (document.createEvent) {
          TH.dispatchEvent(node, event);
        } else {
          node.fireEvent("on" + event.__name, event);
        }
        return event;
      }
    },

    stubRAF(v) {
      let func = null;
      TH.intercept(window, 'requestAnimationFrame', arg =>{
        func = arg;
        return 123;
      });
      v.nextRaf = ()=>{
        if (func !== null) {
          func();
          func = null;
        }
      };
    },

    confirmRemove(func) {
      const dialog = document.body.querySelector('.Dialog #ConfirmRemove');
      assert.elideFromStack.msg('should display Confirm Dialog')(dialog);
      TH.confirm(func);
    },

    confirm(func) {
      const dialog = document.body.querySelector('.Dialog');
      assert.elideFromStack.msg('should display Confirm Dialog')(dialog);
      assert.elideFromStack.dom(dialog, elm=>{
        const data = Dom.current.data(elm);
        assert.isFunction(data.onConfirm);
        func && func(elm);
        TH.click('[name=okay]');
      });
    },
  };

  util.mergeOwnDescriptors(TH, KoruUITH);

  let onAnimationEnd;

  TH.Core.onStart(()=>{
    onAnimationEnd = Dom.Ctx.prototype.onAnimationEnd;
    Dom.Ctx.prototype.onAnimationEnd = function (func, repeat) {
      func(this, this.element());
    };
  });

  TH.Core.onEnd(()=>{Dom.Ctx.prototype.onAnimationEnd = onAnimationEnd});

  module.exports = TH;
});
