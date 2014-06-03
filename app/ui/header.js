define(function(require, exports, module) {
  var App    = require('./app');
  var Dom    = require('koru/dom');
  var Dialog = require('koru/ui/dialog');
  var Help   = require('ui/help');
  require('./page-title');
  require('./sign-in');

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

  return Tpl;
});
