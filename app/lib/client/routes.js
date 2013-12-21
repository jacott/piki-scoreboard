App.require('makeSubject', function (makeSubject) {
  var routes = {};
  var defaultPage;
  var current = null;
  AppRoute = makeSubject({
    setDefault: function (page) {
      defaultPage = page;
    },

    getDefault: function () {
      return defaultPage;
    },

    addRoute: function (path, page) {
      if (path in routes) throw new Error('Path already exists! ', path);
      routes[path] = page;
    },
    setByLocation: function (location, nodefault) {
      if (typeof location === 'string') {
        var page = routes[location];
        location = {pathname: location};
      } else {
        if (location == null)
          location = document.location;
        var page = routes[location.pathname];
      }
      if (! page) {
        if (! nodefault) page = defaultPage;
        if (! page) throw new Error('Page not found');
      }
      var search = location.search;

      if (search) {
        var params = {};
        search.slice(1).split('&').forEach(function (item) {
          var keyValue = item.split('=');
          params[keyValue[0]]=keyValue[1];
        });
      }
      current && current.onExit && current.onExit(location, params);
      current = page;
      page.onEntry(location, params);
    },
  });
});
