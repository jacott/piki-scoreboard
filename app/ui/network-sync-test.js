isClient && define(function (require, exports, module) {
  const koru      = require('koru');
  const session   = require('koru/session');
  const NotifyBar = require('ui/notify-bar');
  const TH        = require('ui/test-helper');

  const sut  = require('./network-sync');
  var v;

  TH.testCase(module, {
    setUp() {
      v = {};
      sut.start();
      document.body.appendChild(NotifyBar.$autoRender());
      this.stub(koru, 'afTimeout').returns(v.kill = this.stub());
    },

    tearDown() {
      sut.stop();
      TH.tearDown();
      v = null;
    },

    "network down": {
      "test cancel timeout"() {
        session.state.notify(false);
        session.state.notify(false);
        assert.calledOnceWith(koru.afTimeout, TH.match.func, 2000);
        refute.called(v.kill);
        session.state.notify(true);
        assert.called(v.kill);
        koru.afTimeout.restore();
        this.stub(koru, 'afTimeout').returns(v.kill = this.stub());
        session.state.notify(false);
        assert.calledWith(koru.afTimeout, TH.match.func, 2000);
      },

      "test failure"() {
        session.state.notify(false);

        refute.dom('#NetworkSync[name=failure]');

        assert.calledWith(koru.afTimeout, TH.match.func, 2000);

        koru.afTimeout.yield();

        assert.dom('#NetworkSync.show[name=failure]', elm => {
          assert.same(elm.getAttribute('title'), 'Connection lost');

        });

        session.state.notify(true);

        assert.dom('#NetworkSync:not(.show)[name=online]');
      },
    },

    "test network mode"() {
      assert.dom('#NotifyBar:not(.on)', elm => {
        assert.dom('#NetworkSync:not(.show)[name=online]');

        sut.mode = 'offline';

        assert.dom('#NetworkSync.show[name=offline]', elm => {
          assert.same(elm.getAttribute('title'), 'Offline');
        });
        assert.className(elm, 'on');
        assert.same(sut.mode, 'offline');

        sut.mode = 'online';
        refute.className(elm, 'on');
        assert.dom('#NetworkSync:not(.show)[name=online]');
        assert.same(sut.mode, 'online');
      });
    },
  });
});
