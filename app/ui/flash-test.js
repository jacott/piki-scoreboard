isClient && define(function (require, exports, module) {
  const koru = require('koru');
  const Dom  = require('koru/dom');
  const TH   = require('./test-helper');

  const sut  = require('./flash');
  var test, v;

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
    },

    tearDown() {
      TH.tearDown();
      v = null;
      Dom.removeId('Flash');
    },

    "test click close"() {
      sut.notice('click to close');

      test.spy(Dom, 'hideAndRemove');

      assert.dom('#Flash', function () {
        TH.click('.m');
        assert.calledWith(Dom.hideAndRemove, this);
      });
    },

    "test call close"() {
      sut.confirm('msg 1');
      sut.confirm('msg 2');
      assert.dom('.m', 'msg 1', elm => {
        sut.close(elm);
      });

      assert.dom('.m', {count: 1});
    },

    "test close after seven seconds"() {
      test.stub(koru, 'afTimeout');

      sut.notice('7 seconds to go');

      assert.calledWith(koru.afTimeout, TH.match.func, 7000);

      test.spy(Dom, 'hideAndRemove');

      assert.dom('#Flash', function () {
        koru.afTimeout.yield();
        assert.calledWith(Dom.hideAndRemove, this);
      });
    },

    "test non-transient"() {
      sut.confirm(Dom.h({
        div: [
          {span: 'New version available'},
          {button: 'refresh'},
          {button: 'dismiss'},
        ]
      }));

      assert.dom('#Flash', elm => {
        assert.dom('.m.notice:not(.transient)');
      });
    },

    "test msg translation"() {
      sut.error('unexpected_error:');

      assert.dom('#Flash>.m.error', "An unexpected error has occurred:");
    },

    "test error"() {
      sut.error('how now brown cow');

      assert.dom('#Flash>.error.m.transient', 'how now brown cow');

      sut.error('new message');

      assert.same(document.getElementsByClassName('error').length, 1);

      TH.click('#Flash>.error.m');

      refute.dom('#Flash');
    },

    "test not human readable error in globalErrorCatch"() {
      koru.globalErrorCatch({error: 500, reason : {foo: 123}});
      assert.dom('#Flash>.error.m', 'Update failed: {foo: 123}');
    },

    "test field errors in globalErrorCatch"() {
      koru.globalErrorCatch({error: 400, reason : {foo: [['too_long', 12]]}});
      assert.dom('#Flash>.notice.m', "Update failed: foo: 12 characters is the maximum allowed");
    },

    "test globalCallback"() {
      koru.globalCallback("my error message");
      assert.dom("#Flash", elm => {
        assert.dom('.m.error', "my error message");
      });
    },

    "test globalErrorCatch"() {
      koru.globalErrorCatch({error: 440, reason: "foo"});
      assert.dom('#Flash>.notice.transient', 'foo');

      koru.globalErrorCatch({error: 500, reason: "foo"});

      assert.dom('#Flash>:not(.notice).transient', 'foo');

      koru.globalErrorCatch({toString() {
        return "bar";
      }});

      assert.dom('#Flash', 'bar');
    },
  });
});
