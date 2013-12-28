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

    addTemplate: function (template, options) {
      this.addRoute(template.PATHNAME = name(template), template);

      if ('onEntry' in template) return;

      template.onEntry = onEntryFunc(template, options);
      template.onExit = onExitFunc(template);

      function name(template) {
        if ('parent' in template)
          return name(template.parent) + templatePath(template);

        return templatePath(template);
      }
    },

    get routes() {
      return routes;
    },

    addRoute: function (path, template) {
      if (path in routes) throw new Error('Path already exists! ', path);
      routes[path] = template;
    },

    setByTemplate: function (template) {
      return this.setByLocation(template.PATHNAME);
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

function templatePath(template) {
  return '/'+Apputil.dasherize(template.name);
}

function onEntryFunc(template, options) {
  return function () {
    if (options) {
      if (typeof options.data ==='function') {
        var data = options.data.call(template);
      } else {
        var data = options.data;
      }
    }
    document.body.appendChild(template.$autoRender(data||{}));
  };
}

function onExitFunc(template) {
  return function () {
    Bart.remove(document.getElementById(template.name));
  };
}
