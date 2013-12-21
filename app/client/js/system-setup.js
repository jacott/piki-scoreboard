var Tpl = Bart.SystemSetup;

AppRoute.addRoute(Tpl.PATHNAME = '/system-setup', Tpl);

App.extend(Tpl, {
  onEntry: function () {
    document.body.appendChild(Tpl.$autoRender({}));
  },
});
