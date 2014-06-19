define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var RegUpload = require('./reg-upload-client');
  var session = require('koru/session');
  var Event = require('models/event');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {
        event: TH.Factory.createEvent(),
        fileReader: window.FileReader,
      };
    },

    tearDown: function () {
      window.fileReader = v.fileReader;
      v = null;
    },

    'test uploading': function () {
      var file = {name: 'foo.csv', slice: test.stub().returns("abcd")};
      var frStub = window.FileReader = TH.MockFileReader(v);

      test.stub(session, 'rpc');

      RegUpload.upload(v.event._id, file, function (error, result) {
        v.callResultError = error;
        v.callResultResult = result;
      });

      assert.equals(v.fileReaderargs, []);
      var fr = v.fileReader;
      assert.same(fr.constructor, frStub);
      assert.isFunction(fr.onload);
      assert.same(fr.blob, "abcd");

      fr.result = ['a','b','c'];
      var u8result = new Uint8Array(fr.result);
      fr.onload();
      assert.calledWithExactly(session.rpc, 'Reg.upload', v.event._id, u8result, TH.match(function (func) {
        v.callResultFunc = func;
        return typeof func === 'function';
      }));

      v.callResultFunc('bad file', 'the result');

      assert.same(v.callResultError, 'bad file');
      assert.same(v.callResultResult, 'the result');
    },
  });
});
