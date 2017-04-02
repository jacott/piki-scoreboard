isClient && define(function (require, exports, module) {
  const koru          = require('koru');
  const Dom           = require('koru/dom');
  const session       = require('koru/session');
  const NetworkSync   = require('ui/network-sync');
  const NotifyBar     = require('ui/notify-bar');
  const TH            = require('./test-helper');

  const sut  = require('./loading');
  var v;

  TH.testCase(module, {
    setUp() {
      v = {};
    },

    tearDown() {
      sut.stop();
      TH.tearDown();
      NetworkSync.mode = 'online';
      v = null;
    },

    "test progress"() {
      sut.start();
      assert.dom(sut.loadingProgressElement, elm => {
        sut.loadProgress(50);
        refute.className(elm, 'hide');
        assert.cssNear(elm.firstElementChild.style.width, 50, 0.1, '%');

        sut.loadProgress(100);
        assert.className(elm, 'complete');
        refute.className(elm, 'hide');
        assert.cssNear(elm.firstElementChild.style.width, 100, 0.1, '%');

        TH.trigger(elm, 'animationend');

        assert.className(elm, 'hide');

        sut.loadProgress(60);
        refute.className(elm, 'hide');
        refute.className(elm, 'complete');
        assert.cssNear(elm.firstElementChild.style.width, 60, 0.1, '%');
      });
    },

    "when started": {
      setUp() {
        this.stub(koru, 'afTimeout');
        this.stub(session.state.pending, 'onChange').returns({stop: v.stop = this.stub()});
        this.stub(window, 'addEventListener');
        this.stub(window, 'removeEventListener');

        sut.start();
      },

      "test network sync pending"() {
        document.body.appendChild(NotifyBar.$autoRender());
        const callback = session.state.pending.onChange.args(0, 0);
        assert.isFunction(callback);

        assert.dom('#NotifyBar', elm => {
          callback(true);
          assert.dom('#NetworkSync.show[name=pending]', elm => {
            assert.same(elm.getAttribute('title'), 'Waiting for response');
          });

          callback(false);
          assert.dom('#NetworkSync:not(.show)[name=online]');
        });
      },

      "test offline network sync pending"() {
        NetworkSync.mode = 'offline';
        document.body.appendChild(NotifyBar.$autoRender());
        const callback = session.state.pending.onChange.args(0, 0);
        assert.isFunction(callback);

        assert.dom('#NotifyBar', elm => {
          callback(true);
          assert.dom('#NetworkSync.show[name=offline]');

          callback(false);
          assert.dom('#NetworkSync.show[name=offline]');
        });
      },

      "test startup"() {
        assert.same(sut.progress, 50);

        assert.called(session.state.pending.onChange);
        assert.calledWith(window.addEventListener, 'beforeunload');

        session.state.pending.onChange.yield(true);

        assert.calledOnceWith(koru.afTimeout, TH.match.func, 2000);
        this.stub(session.state, 'pendingCount')
          .onCall(0).returns(4)
          .onCall(1).returns(0)
        ;

        sut.loadProgress(100);

        koru.afTimeout.yield();

        assert.same(sut.progress, 25);

        session.state.pending.onChange.yield(false);

        assert.same(sut.progress, 100);

        let pendingUpdateCount = 2;
        this.stub(session.state, 'pendingUpdateCount', () => pendingUpdateCount);


        window.addEventListener.yield(v.ev = {});

        assert.same(v.ev.returnValue, "You have unsaved changes.");

        pendingUpdateCount = 0;


        window.addEventListener.yield(v.ev = {});

        assert.same(v.ev.returnValue, undefined);

        sut.stop();

        assert.called(v.stop);

        assert.called(window.removeEventListener);
      },
    },
  });
});
