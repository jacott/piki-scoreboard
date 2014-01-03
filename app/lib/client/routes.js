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
        this.defaultPage = template;

      if (! ('onEntry' in template))
        template.onEntry = onEntryFunc(template, options);

      if (! ('onExit' in template))
        template.onExit = onExitFunc(template);
    },

    addBase: function (template) {
      if ('route' in template) throw new Error(template.name + ' is already a route base');
      var path = templatePath(template);
      if (path in this.routes) throw new Error('Path already exists! ', path + " for template " + this.path);

      return template.route = this.routes[path] = new AppRoute(path, template, this);
    },

    onBaseExit: function(location) {
      var template = this.template;
      var onBaseExit = template && template.onBaseExit;
      onBaseExit && onBaseExit.call(template, location);
    },

    onBaseEntry: function(location) {
      var template = this.template;
      var onBaseEntry = template && template.onBaseEntry;
      onBaseEntry && onBaseEntry.call(template, location);
    },
  };

  var current = null;
  App.extend(AppRoute, {
    root: new AppRoute(),

    onGotoPath: function (func) {
      this._onGotoPath = func;
    },

    gotoPage: function (page, location) {
      if (page && ! ('onEntry' in page)) {
        if ('route' in page)
          page = page.route.defaultPage;
        else
          page = page.defaultPage;
      }
      if (! location)
        location = {pathname: pathname(page)};

      if (current) {
        current.onExit && current.onExit(page, location);

        exitEntry(toPath(current.route), toPath(page && page.route), location);
      } else {
        exitEntry([], toPath(page && page.route), location);
      }

      if (! page) {
        current = null;
      } else {
        page = page.Index || page;
        current = page;
        page.onEntry(location);
      }
    },

    gotoPath: function (location) {
      if (typeof location === 'string') {
        var page = location;
        location = {pathname: location};
      } else {
        if (location == null)
          location = document.location;
        var page = location.pathname;
      }

      if (this._onGotoPath)
        page = this._onGotoPath(page);

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

      this.gotoPage(page, location);
    },
  });
});

function pathname(template) {
  if (template && ('route' in template)) {
    return routePath(template.route)+'/'+template.subPath;
  }

  return '';
}

function routePath(route) {
  if (! route || ! route.parent) return '';
  return routePath(route.parent)+'/'+route.path;
}

function exitEntry(exit, entry, location) {
  var entryLen = entry.length;
  var diff = exit.length - entryLen;
  var index = 0;

  for(;index < diff; ++index) {
    exit[index].onBaseExit(location);
  }

  for(;index - diff < entryLen; ++index) {
    var exitItem = exit[index];
    if (exitItem === entry[index - diff]) break;
    exitItem.onBaseExit(location);
  }

  for(index = index - diff - 1 ; index >= 0; --index) {
    entry[index].onBaseEntry(location);
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
