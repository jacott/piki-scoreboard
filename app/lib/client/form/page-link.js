var $ = Bart.current;
var Tpl = Bart.Form.PageLink;
var IGNORE = {name: true, link: true, template: true};

Tpl.$helpers({
  attrs: function () {
    var elm = $.element;
    var data = $.ctx.data;

    var template = data.template;
    if (template) {
      data.link = Bart.lookupTemplate(data.template);
    }

    for(var attr in data) {
      if (! (attr in IGNORE))
        elm.setAttribute(attr, data[attr]);
    }

    Bart.addClass(elm, 'link');
  },
});

Tpl.$events({
  'click': function (event) {
    event.$actioned = true;
    AppRoute.gotoPath(Bart.getCtx(this).data.link);
  },
});

Bart.registerHelpers({
  pageLink: function (options) {
    return Tpl.$autoRender(options);
  },
});
