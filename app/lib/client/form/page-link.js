var Tpl = Bart.Form.PageLink;
var IGNORE = {name: true, link: true};

Tpl.$helpers({
  attrs: function () {
    var ctx = Bart.$ctx;
    var elm = ctx.element;
    var data = ctx.data;

    for(var attr in data) {
      if (! (attr in IGNORE))
        elm.setAttribute(attr, data[attr]);
    }
  },
});

Tpl.$events({
  'click': function (event) {
    event.$actioned = true;
    AppRoute.gotoPath(Bart.getCtx(this).data.link);
  },
});
