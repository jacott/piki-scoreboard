isClient && define(function (require, exports, module) {
  const koru            = require('koru');
  const Route           = require('koru/ui/route');
  const RegUpload       = require('models/reg-upload-client');
  const App             = require('ui/app');
  const Tpl             = require('./reg-upload');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd} = TH;

  let v = null;

  TH.testCase(module, {
    setUp() {
      v = {
        event: TH.Factory.createEvent(),
        user: TH.Factory.createUser('admin'),

        changeListener: Tpl.$findEvent('change', 'input[name=filename]'),
      };

      v.origListener = v.changeListener[2];
      v.fileStub = {files: ['foo file']};
      v.changeListener[2] = function () {
        v.origListener.apply(v.fileStub, arguments);
      };
      TH.loginAs(v.user);

      TH.setOrg(v.org);
      v.eventSub = stub(App, 'subscribe').withArgs('Event').returns({stop: v.stop = stub()});
      Route.gotoPage(Tpl, {eventId: v.event._id});
      v.eventSub.yield();
    },

    tearDown() {
      v.changeListener[2] = v.origListener;
      TH.tearDown();
      v = null;
    },

    "import": {
      'test bad'() {
        uploadResult(new koru.Error(415, 'unsupported_import_format'));
        assert.dom('#RegUpload:not(.uploading)', function () {
          assert.dom('input.error[name=filename]');
          assert.dom('.errorMsg', 'The uploaded file is unsupported');
        });
      },

      'test success'() {
        uploadResult(null, 'new_id');

        refute.dom('.Dialog');
      },

      'test uploading'() {
        const uploadStub = stub(RegUpload, 'upload');

        assert.dom('#RegUpload:not(.uploading)', function () {
          TH.trigger('input[name=filename]', 'change');
        });
        assert.calledOnceWith(uploadStub, v.event._id, 'foo file',
                              TH.match(result => typeof result === 'function'));
        assert.dom('#RegUpload.uploading');
      },
    },

    "test rendering"() {
      assert.dom('#Event #RegUpload .upload', function () {
        assert.dom('label input[type=file][name=filename]');
      });
    },
  });

  function uploadResult(error, result) {
    var uploadStub = stub(RegUpload, 'upload');

    TH.trigger('#RegUpload input[name=filename]', 'change');
    var callback = uploadStub.args(0, 2);
    callback(error, result);
    return callback;
  }
});
