var Tpl = Bart.Profile;

AppRoute.root.addTemplate(Tpl, {
  focus: true,

});

Tpl.$extend({
  $created: function (ctx, elm) {
    var me = AppModel.User.me();

    if (me.isSuperUser()) AppRoute.abortPage(Bart.SystemSetup);

    ctx.data = me;
  },
});
