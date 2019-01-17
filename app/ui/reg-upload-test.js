isClient && define((require, exports, module)=>{
  const koru            = require('koru');
  const Route           = require('koru/ui/route');
  const EventSub        = require('pubsub/event-sub');
  const Factory         = require('test/factory');
  const Tpl             = require('./reg-upload');
  const TH              = require('./test-helper');

  const RegUpload = require('models/reg-upload-client');

  const {stub, spy, onEnd} = TH;

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      v.event = Factory.createEvent();
      v.user = Factory.createUser('admin');
      v.origListener = Tpl.$findEvent('change', 'input[name=filename]')[2];
      v.fileStub = {files: ['foo file']};
      TH.loginAs(v.user);

      TH.setOrg(v.org);
      v.eventSub = stub(EventSub, 'subscribe').returns({stop: v.stop = stub()});
      Route.gotoPage(Tpl, {eventId: v.event._id});
      v.eventSub.yield();
    });

    afterEach(()=>{
      TH.tearDown();
      v = {};
    });

    group("import", ()=>{
      test("bad", ()=>{
        uploadResult(new koru.Error(415, 'unsupported_import_format'));
        assert.dom('#RegUpload:not(.uploading)', function () {
          assert.dom('input.error[name=filename]');
          assert.dom('.errorMsg', 'The uploaded file is unsupported');
        });
      });

      test("success", ()=>{
        uploadResult(null, 'new_id');

        refute.dom('.Dialog');
      });

      test("uploading", ()=>{
        const uploadStub = stub(RegUpload, 'upload');

        assert.dom('#RegUpload:not(.uploading)', form =>{
          v.origListener.call(v.fileStub, {currentTarget: form});
        });
        assert.calledOnceWith(uploadStub, v.event._id, 'foo file',
                              TH.match(result => typeof result === 'function'));
        assert.dom('#RegUpload.uploading');
      });
    });

    test("rendering", ()=>{
      assert.dom('#Event #RegUpload .upload', function () {
        assert.dom('label input[type=file][name=filename]');
      });
    });
  });

  const uploadResult = (error, result)=>{
    const uploadStub = stub(RegUpload, 'upload');

    TH.trigger('#RegUpload input[name=filename]', 'change');
    const callback = uploadStub.args(0, 2);
    callback(error, result);
    return callback;
  };
});
