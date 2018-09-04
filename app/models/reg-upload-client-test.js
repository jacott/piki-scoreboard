define((require, exports, module)=>{
  const session         = require('koru/session');
  const Event           = require('models/event');
  const TH              = require('test-helper');

  const {stub, spy, onEnd, match: m} = TH;

  const RegUpload = require('./reg-upload-client');

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      v.event = TH.Factory.createEvent();
      v.fileReader = window.FileReader;
    });

    afterEach(()=>{
      window.fileReader = v.fileReader;
      v = {};
    });

    test("uploading", ()=>{
      const file = {name: 'foo.csv', slice: stub().returns("abcd")};
      const frStub = window.FileReader = TH.MockFileReader(v);

      stub(session, 'rpc');

      RegUpload.upload(v.event._id, file, (error, result)=>{
        v.callResultError = error;
        v.callResultResult = result;
      });

      assert.equals(v.fileReaderargs, []);
      const fr = v.fileReader;
      assert.same(fr.constructor, frStub);
      assert.isFunction(fr.onload);
      assert.same(fr._result2Str(), "abcd");

      fr.onload();
      let callResultFunc;
      assert.calledWithExactly(session.rpc, 'Reg.upload', v.event._id,
                               m(arg => 'abcd' === fr._result2Str(arg)),
                               m(func => callResultFunc = func));

      callResultFunc('bad file', 'the result');

      assert.same(v.callResultError, 'bad file');
      assert.same(v.callResultResult, 'the result');
    });
  });
});
