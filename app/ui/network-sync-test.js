isClient && define(function (require, exports, module) {
  const koru            = require('koru');
  const session         = require('koru/session');
  const NotifyBar       = require('ui/notify-bar');
  const TH              = require('ui/test-helper');

  const {stub, spy, after} = TH;

  const sut = require('./network-sync');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let kill;
    beforeEach(() => {
      TH.startTransaction();
      sut.start();
      document.body.appendChild(NotifyBar.$autoRender());
      kill = stub();
      stub(koru, 'afTimeout').returns(kill);
    });

    afterEach(() => {
      sut.stop();
      TH.domTearDown();
      TH.rollbackTransaction();
    });

    group('network down', () => {
      test('cancel timeout', () => {
        session.state.notify(false);
        session.state.notify(false);
        assert.calledOnceWith(koru.afTimeout, TH.match.func, 2000);
        refute.called(kill);
        session.state.notify(true);
        assert.called(kill);
        koru.afTimeout.restore();
        kill.reset();
        stub(koru, 'afTimeout').returns(kill);
        session.state.notify(false);
        assert.calledWith(koru.afTimeout, TH.match.func, 2000);
      });

      test('failure', () => {
        session.state.notify(false);

        refute.dom('#NetworkSync[name=failure]');

        assert.calledWith(koru.afTimeout, TH.match.func, 2000);

        koru.afTimeout.yield();

        assert.dom('#NetworkSync.show[name=failure]', (elm) => {
          assert.same(elm.getAttribute('title'), 'Connection lost');
        });

        session.state.notify(true);

        assert.dom('#NetworkSync:not(.show)[name=online]');
      });
    });

    test('network mode', () => {
      assert.dom('#NotifyBar:not(.on)', (elm) => {
        assert.dom('#NetworkSync:not(.show)[name=online]');

        sut.mode = 'offline';

        assert.dom('#NetworkSync.show[name=offline]', (elm) => {
          assert.same(elm.getAttribute('title'), 'Offline');
        });
        assert.className(elm, 'on');
        assert.same(sut.mode, 'offline');

        sut.mode = 'online';
        refute.className(elm, 'on');
        assert.dom('#NetworkSync:not(.show)[name=online]');
        assert.same(sut.mode, 'online');
      });
    });
  });
});
