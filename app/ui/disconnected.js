define(function(require, exports, module) {
  var util = require('koru/util');
  var Dom = require('koru/dom');
  var session = require('koru/session');

  var Tpl   = Dom.newTemplate(require('koru/html!./disconnected'));
  var $ = Dom.current;

  Tpl.$events({
    'click [name=connect]': function (event) {
      Dom.stopEvent();
      session.connect();
    }
  });

  return Tpl;
});
