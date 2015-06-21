isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var Tpl = require('./reg-upload');
  var App = require('ui/app');
  var Route = require('koru/ui/route');
  var koru = require('koru');
  var RegUpload = require('models/reg-upload-client');

  TH.testCase(module, {
    setUp: function () {
      test = this;
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
      v.eventSub = test.stub(App, 'subscribe').withArgs('Event').returns({stop: v.stop = test.stub()});
      Route.gotoPage(Tpl, {eventId: v.event._id});
      v.eventSub.yield();
    },

    tearDown: function () {
      v.changeListener[2] = v.origListener;
      TH.tearDown();
      v = null;
    },

    "import": {
      'test bad': function () {
        uploadResult(new koru.Error(415, 'unsupported_import_format'));
        assert.dom('#RegUpload:not(.uploading)', function () {
          assert.dom('input.error[name=filename]');
          assert.dom('.errorMsg', 'The uploaded file is unsupported');
        });
      },

      'test success': function () {
        uploadResult(null, 'new_id');

        refute.dom('.Dialog');
      },

      'test uploading': function () {
        var uploadStub = test.stub(RegUpload, 'upload');

        assert.dom('#RegUpload:not(.uploading)', function () {
          TH.trigger('input[name=filename]', 'change');
        });
        assert.calledOnceWith(uploadStub, v.event._id, 'foo file', TH.match(function (result) {
          return typeof result === 'function';
        }));
        assert.dom('#RegUpload.uploading');
      },
    },

    "test rendering": function () {
      assert.dom('#Event #RegUpload .upload', function () {
        assert.dom('label input[type=file][name=filename]');
      });
    },
  });

  function uploadResult(error, result) {
    var uploadStub = test.stub(RegUpload, 'upload');

    TH.trigger('#RegUpload input[name=filename]', 'change');
    var callback = uploadStub.args[0][2];
    callback(error, result);
    return callback;
  }
});
