App.require('makeSubject', function (makeSubject) {
  AppRoute = function (path, template, parent) {
    this.path = path || '';
    this.template = template;
    this.parent = parent;
    this.routes = {};
  };

  AppRoute.prototype = {
    constructor: AppRoute,

    addTemplate: function (template, options) {
      options = options || {};
      var path = options.path || templatePath(template);
      if (path in this.routes) throw new Error('Path already exists! ', path + " for template " + this.path);
      this.routes[path] = template;
      template.route = this;
      template.subPath = path;

      if (options.defaultPage)
        this.defaultPage = true;

      if (! ('onEntry' in template))
        template.onEntry = onEntryFunc(template, options);

      if (! ('onExit' in template))
        template.onExit = onExitFunc(template);
    },

    addBase: function (template) {
      if ('route' in template) throw new Error(template.name + ' is already a route base');
      var path = templatePath(template);
      if (path in this.routes) throw new Error('Path already exists! ', path + " for template " + this.path);

      template.subPath = path;
      return template.route = this.routes[path] = new AppRoute(path, template, this);
    },

    onBaseExit: function() {
      var template = this.template;
      var onBaseExit = template && template.onBaseExit;
      onBaseExit && onBaseExit.call(template);
    },

    onBaseEntry: function() {
      var template = this.template;
      var onBaseEntry = template && template.onBaseEntry;
      onBaseEntry && onBaseEntry.call(template);
    },
  };

  var current = null;
  App.extend(AppRoute, {
    root: new AppRoute(),

    gotoPage: function (page, params) {
      if (current) {
        current.onExit && current.onExit(page, params);

        exitEntry(toPath(current.route), toPath(page && page.route));
      } else {
        exitEntry([], toPath(page && page.route));
      }

      if (! page) {
        current = null;
      } else {
        page = page.Index || page;
        current = page;
        page.onEntry(params);
      }
    },

    gotoPath: function (location, nodefault) {
      if (typeof location === 'string') {
        var page = location;
        location = {pathname: location};
      } else {
        if (location == null)
          location = document.location;
        var page = location.pathname;
      }

      var parts = page.split('/');
      var root = this.root;
      var page = root;
      var newPage = root.defaultPage;
      for(var i = 0; i < parts.length; ++i) {
        var part = parts[i];
        if (! part) continue;
        newPage = page.routes[part] || page.defaultPage;
        if (! newPage) {
          break;
        }
        page = newPage;
      }

      if (newPage === root.defaultPage)
        page = newPage;

      if (page === root)
        throw new Error('Page not found');

      var search = location.search;

      if (search) {
        var params = {};
        search.slice(1).split('&').forEach(function (item) {
          var keyValue = item.split('=');
          params[keyValue[0]]=keyValue[1];
        });
      }

      this.gotoPage(page, params);
    },
  });
});

function exitEntry(exit, entry) {
  var entryLen = entry.length;
  var diff = exit.length - entryLen;
  var index = 0;

  for(;index < diff; ++index) {
    exit[index].onBaseExit();
  }

  for(;index - diff < entryLen; ++index) {
    var exitItem = exit[index];
    if (exitItem === entry[index - diff]) break;
    exitItem.onBaseExit();
  }

  for(index = index - diff - 1 ; index >= 0; --index) {
    entry[index].onBaseEntry();
  }
}

function toPath(route) {
  var path = [];
  while(route) {
    path.push(route);
    route = route.parent;
  }
  return path;
}

function templatePath(template) {
  return Apputil.dasherize(template.name);
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
    var route = template.route;


    if (route && route.template) {
      var parent = document.getElementById(route.template.name);
      if (parent)
        parent = parent.querySelector('.body') || parent;
    }
    (parent || document.body).appendChild(template._renderedPage = template.$autoRender(data||{}));
  };
}

function onExitFunc(template) {
  return function () {
    Bart.remove(template._renderedPage, document.getElementById(template.name));
  };
}
