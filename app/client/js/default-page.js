var defaultPage = {
  onEntry: function (params) {
    var handle = App.Ready.onReady(whenReady);

    function whenReady() {
      handle && handle.stop();

      var user = AppModel.User.me();
      if (user && user.isSuperUser())
        AppRoute.gotoPage(Bart.SystemSetup, 'nodefault');

      return false;
    }
  },
};

AppRoute.setDefault(defaultPage);
