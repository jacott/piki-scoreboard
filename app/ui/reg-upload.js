define(function(require, exports, module) {
  var koru = require('koru');
  var App   = require('./app-base');
  var Dom   = require('koru/dom');
  var Route = require('koru/ui/route');
  var Tpl   = Dom.newTemplate(require('koru/html!./reg-upload'));
  var util  = require('koru/util');
  var eventTpl = require('./event');
  require('./climber');
  var Form = require('koru/ui/form');
  var RegUpload = require('models/reg-upload-client');

  var $ = Dom.current;

  koru.onunload(module, function () {
    eventTpl.route.removeTemplate(Tpl);
  });

  eventTpl.route.addTemplate(module, Tpl, {
    focus: true,
    data: function (page, pageRoute) {
      if (! eventTpl.event) Route.abortPage();

      return eventTpl.event;
    }
  });

  Tpl.$extend({
    $created: function (ctx) {
      Dom.autoUpdate(ctx);
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

      Dom.addClass(form, 'uploading');
      RegUpload.upload(ev._id, file, function uploadCallback(err, result) {
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

  return Tpl;
});
