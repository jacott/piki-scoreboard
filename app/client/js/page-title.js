var $ = Bart.current;
var Tpl = Bart.PageTitle;
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
    Bart.stopEvent();
    if (titleArgs) {
      AppRoute.gotoPath.apply(AppRoute, titleArgs);
    }
  },
});

Bart.setTitle = function (title) {
  var ctx = Bart.getCtx(titleElm);
  if (! ctx) return;
  ctx.data.title = title;
  ctx.updateAllTags();
};

Bart.setTitleLink = function (args) {
  titleArgs = args;
}
