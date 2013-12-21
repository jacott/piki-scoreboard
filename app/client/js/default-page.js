var defaultPage = {
  onEntry: function (loc, params) {
    var handle = App.Ready.onReady(whenReady);

    function whenReady() {
      handle && handle.stop();

      var user = AppModel.User.me();
      if (user && user.isSuperUser())
        AppRoute.setByLocation(Bart.SystemSetup.PATHNAME, 'nodefault');

      return false;
    }
  },
};

AppRoute.setDefault(defaultPage);
