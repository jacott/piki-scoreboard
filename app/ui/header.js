define(function(require, exports, module) {
  var App    = require('./app-base');
  var Dom    = require('koru/dom');
  var Dialog = require('koru/ui/dialog');
  var Help   = require('ui/help');

  var Tpl = Dom.newTemplate(require('koru/html!./header'));

  Tpl.$helpers({
    orgHomeLinkText: function () {
      var org = App.org();
      if (org) return org.name;
      return 'Choose Organization';
    },
  });

  Tpl.$events({
    'click [name=help]': function (event) {
      Dom.stopEvent();
      Dialog.open(Help.$autoRender({}));
    },
  });

  Tpl.$extend({
    show: function () {
      Dom.removeId('Header');
      document.body.insertBefore(Tpl.$autoRender({}), document.body.firstChild);
    },
  });

  Dom.setTitle = function (title) {
  };

  return Tpl;
});
