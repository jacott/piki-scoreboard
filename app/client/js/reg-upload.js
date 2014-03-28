var $ = Bart.current;
var Event = Bart.Event;
var Tpl = Event.RegUpload;

Bart.Event.route.addTemplate(Tpl, {
  focus: true,
  data: function (page, pageRoute) {
    if (! Event.event) AppRoute.abortPage();

    return Event.event;
  }
});

Tpl.$extend({
  $created: function (ctx) {
    Bart.autoUpdate(ctx);
  },
});

Tpl.$helpers({
  eachError: function () {
    var frag = document.createDocumentFragment();

    this.errors && this.errors.forEach(function (error) {
      frag.appendChild(Tpl.ErrorRow.$render(error));
    });
    return frag;
  },
});

Tpl.$events({
  'change input[name=filename]': function (event) {
    var fileInput = this;
    var file;
    var mFile;
    var form = event.currentTarget;
    var ev = $.data(form);

    file = fileInput.files[0];

    Bart.addClass(form, 'uploading');
    App.Reg.upload(ev._id, file, function uploadCallback(err, result) {
      Bart.removeClass(form, 'uploading');
      if (err) {
        Bart.Form.renderError(form, 'filename', AppClient.text(err.reason));
        return;
      } else {
        Bart.Form.clearErrors(form);
        Bart.remove(form.querySelector('.upload'));
      }
    });
  },
});

Tpl.ErrorRow.$helpers({
  line: function () {
    return this[0];
  },

  fields: function () {
    return JSON.stringify(this[1]);
  },

  message: function () {
    return this[2];
  },

});
