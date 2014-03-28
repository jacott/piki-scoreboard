var $ = Bart.current;
var Tpl = Bart.RegUpload;

Tpl.$extend({
  show: function (org) {
    Bart.Dialog.open(Tpl.$autoRender(org));
  },
});

Tpl.$events({
  'change input[name=filename]': function (event) {
    var fileInput = this;
    var file;
    var mFile;
    var form = event.currentTarget;
    var org = $.data(form);

    file = fileInput.files[0];

    Bart.addClass(form, 'uploading');
    App.Reg.upload(org._id, file, function uploadCallback(err, result) {
      if (err) {
        Bart.removeClass(form, 'uploading');
        Bart.Form.renderError(form, 'filename', AppClient.text(err.reason));
        return;
      }
      Bart.Dialog.close(form);
    });
  },
});
