define((require, exports, module)=>{
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const Form            = require('koru/ui/form');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const RegUpload       = require('models/reg-upload-client');
  const App             = require('./app-base');
  require('./climber');
  const eventTpl        = require('./event');

  const Tpl = Dom.newTemplate(require('koru/html!./reg-upload'));
  const $ = Dom.current;

  eventTpl.route.addTemplate(module, Tpl, {
    focus: true,
    data: (page, pageRoute)=>{
      if (! eventTpl.event) Route.abortPage();

      return eventTpl.event;
    }
  });

  App.restrictAccess(Tpl);

  Tpl.$extend({
    $created: ctx =>{ctx.autoUpdate()},
  });

  Tpl.$helpers({
    eachError() {
      var frag = document.createDocumentFragment();

      this.errors && this.errors.forEach(function (error) {
        frag.appendChild(Tpl.ErrorRow.$render(error));
      });
      return frag;
    },
  });

  Tpl.$events({
    'change input[name=filename]'(event) {
      let file;
      let mFile;
      const form = event.currentTarget;
      const ev = $.data(form);

      file = this.files[0];

      this.value = '';

      Dom.addClass(form, 'uploading');
      RegUpload.upload(ev._id, file, (err, result)=>{
        Dom.removeClass(form, 'uploading');
        if (err) {
          Form.renderError(form, 'filename', App.text(err.reason));
          return;
        } else {
          Form.clearErrors(form);
          Dom.remove(form.querySelector('.upload'));
        }
      });
    },
  });

  Tpl.ErrorRow.$helpers({
    line() {return this[0]},
    fields() {return JSON.stringify(this[1])},
    message() {return this[2]},
  });

  module.onUnload(()=>{eventTpl.route.removeTemplate(Tpl)});

  return Tpl;
});
