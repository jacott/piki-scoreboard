define(function(require, exports, module) {
  const TH       = Object.create(require('test-helper'));
  const koru         = require('koru');
  const Dom          = require('koru/dom');
  const localStorage = require('koru/local-storage');
  require('koru/ui/helpers');
  const Route        = require('koru/ui/route');
  const KoruUITH     = require('koru/ui/test-helper');
  const util         = require('koru/util');
  const Factory      = require('test/factory');
  const App          = require('ui/app');

  koru.onunload(module, 'reload');

  util.mergeOwnDescriptors(TH, KoruUITH);
  util.merge(TH, {
    setOrg(org) {
      org = org || Factory.createOrg();
      App.orgId = org._id;
      localStorage.setItem('orgSN', org.shortName);
      Dom.addClass(document.body, 'inOrg');
    },

    tearDown(v) {
      TH.domTearDown();
      TH.clearDB();
      util.thread.userId = null;
    },

    addStyles(styles) {
      var style = Dom.h({style: '', class: "testStyle"});

      style.innerHTML = styles;
      document.head.appendChild(style);
    },

    findDomEvent(template, type) {
      return template._events.filter(function (event) {
        return event[0] === type;
      });
    },

    pointer(node, eventName, args) {
      if (typeof node === 'string') {
        assert.elideFromStack.dom(node, function () {
          TH.pointer(this, eventName, args);
        });
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
      var func;
      TH.geddon.test.intercept(window, 'requestAnimationFrame', function (arg) {
        func = arg;
        return 123;
      });
      v.nextRaf = function () {
        if (func) {
          func();
          func = null;
        }
      };
    },

    confirmRemove(func) {
      var dialog = document.body.querySelector('.Dialog');
      assert.elideFromStack.msg('should display Confirm Dialog')(dialog);
      assert.elideFromStack.dom(dialog, function () {
        assert.elideFromStack.dom('#ConfirmRemove', function () {
          func && func();
        });
        TH.click('[name=okay]');
        assert.elideFromStack.msg('should close confirm dialog')
          .same(this.parentNode, null);

      });
    },
  });

  var onAnimationEnd;

  TH.geddon.onStart(function () {
    onAnimationEnd = Dom.Ctx.prototype.onAnimationEnd;
    Dom.Ctx.prototype.onAnimationEnd = function (func, repeat) {
      func(this, this.element());
    };
  });

  TH.geddon.onEnd(function () {
    Dom.Ctx.prototype.onAnimationEnd = onAnimationEnd;
  });

  module.exports = TH;
});
