var defaultPage = {
  onEntry: function (location) {
    var handle = App.Ready.onReady(whenReady);

    function whenReady() {
      handle && handle.stop();

      var user = AppModel.User.me();
      if (user && user.isSuperUser())
        AppRoute.gotoPage(Bart.SystemSetup, location);
      else
        AppRoute.gotoPage(Bart.Org, location);

      return false;
    }
  },
};

AppRoute.root.defaultPage = defaultPage;
