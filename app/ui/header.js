define(function(require, exports, module) {
  const Dom    = require('koru/dom');
  const Dialog = require('koru/ui/dialog');
  const Route  = require('koru/ui/route');
  const Help   = require('ui/help');
  const App    = require('./app-base');

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
    const pageTitle = document.getElementById('PageTitle');
    if (pageTitle)
      pageTitle.textContent = title;
    return `Piki ${Route.currentPageRoute && Route.currentPageRoute.orgSN}: ${title}`;
  };

  return Tpl;
});
