define(function(require, exports, module) {
  var Dom    = require('koru/dom');
  var Route = require('koru/ui/route');

  var Tpl = Dom.newTemplate(require('koru/html!./page-title'));
  var $ = Dom.current;

  var titleElm, titleArgs;

  Tpl.$extend({
    $created: function (ctx, elm) {
      ctx.data = {};
      titleElm = elm;
    },

    $destroyed: function (ctx, elm) {
      titleElm = titleArgs = null;
    },
  });

  Tpl.$events({
    'click': function (event) {
      Dom.stopEvent();
      if (titleArgs) {
        Route.gotoPath.apply(Route, titleArgs);
      }
    },
  });

  Dom.setTitle = function (title) {
    var ctx = Dom.getCtx(titleElm);
    if (! ctx) return;
    ctx.data.title = title;
    ctx.updateAllTags();
  };

  Dom.setTitleLink = function (args) {
    titleArgs = args;
  };
});
