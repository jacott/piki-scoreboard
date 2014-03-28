(function (test, v) {
  buster.testCase('client/reg-upload:', {
    setUp: function () {
      test = this;

      v = {
        event: TH.Factory.createEvent(),
        user: TH.Factory.createUser('admin'),

        changeListener: Bart.Event.RegUpload.$findEvent('change', 'input[name=filename]'),
      };

      v.origListener = v.changeListener[2];
      v.fileStub = {files: ['foo file']};
      v.changeListener[2] = function () {
        v.origListener.apply(v.fileStub, arguments);
      };
      test.stub(AppClient, 'setLocationHref');

      TH.loginAs(v.user);

      TH.setOrg(v.org);
      v.eventSub = App.subscribe.withArgs('Event').returns({stop: v.stop = test.stub()});
      AppRoute.gotoPage(Bart.Event.RegUpload, {eventId: v.event._id});
      v.eventSub.yield();
    },

    tearDown: function () {
      v.changeListener[2] = v.origListener;
      v = null;
    },

    "import": {
      'test bad': function () {
        uploadResult(new Meteor.Error(415, 'unsupported_import_format'));
        assert.dom('#RegUpload:not(.uploading)', function () {
          assert.dom('input.error[name=filename]');
          assert.dom('span.errorMsg', 'The uploaded file is unsupported');
        });
      },

      'test success': function () {
        uploadResult(null, 'new_id');

        assert(Session.equals('Dialog', undefined));
      },

      'test uploading': function () {
        var uploadStub = test.stub(App.Reg, 'upload');

        assert.dom('#RegUpload:not(.uploading)', function () {
          TH.trigger('input[name=filename]', 'change');
        });
        assert.calledOnceWith(uploadStub, v.event._id, 'foo file', sinon.match(function (result) {
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
    var uploadStub = test.stub(App.Reg, 'upload');

    TH.trigger('#RegUpload input[name=filename]', 'change');
    var callback = uploadStub.args[0][2];
    callback(error, result);
    return callback;
  }
})();
