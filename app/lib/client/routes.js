App.require('makeSubject', function (makeSubject) {
  AppRoute = function (path, template, parent) {
    this.path = path || '';
    this.template = template;
    this.parent = parent;
    this.routes = {};
  };

  AppRoute.history = window.history;

  AppRoute.prototype = {
    constructor: AppRoute,

    addTemplate: function (template, options) {
      options = options || {};
      var path = options.path;
      if (path == null) path = templatePath(template);
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

    onBaseExit: function(page, location) {
      var template = this.template;
      var onBaseExit = template && template.onBaseExit;
      onBaseExit && onBaseExit.call(template, page, location);
    },

    onBaseEntry: function(page, location) {
      var template = this.template;
      var onBaseEntry = template && template.onBaseEntry;
      onBaseEntry && onBaseEntry.call(template, page, location);
    },
  };

  var current = null;
  var pageState = 'pushState';
  App.extend(AppRoute, {
    root: new AppRoute(),

    abortPage: function (location) {
      var error = new Error('abortPage');
      error.location = location;
      error.abortPage = true;
      throw error;
    },

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

      try {
        if (current) {
          current.onExit && current.onExit(page, location);

          exitEntry(toPath(current.route), toPath(page && page.route), page, location);
        } else {
          exitEntry([], toPath(page && page.route), page, location);
        }

        if (! page) {
          current = null;
        } else {
          page = page.Index || page;
          var href = page.onEntry(page, location) || location.href || location.pathname;
          var  title = document.title = page.title || AppRoute.title;
          if (pageState && current !== page && ! ('noPageHistory' in page)) {
            AppRoute.history[pageState](null, title, href);
          }
          current = page;
        }
      }
      catch(ex) {
        if (ex.abortPage) return this.gotoPath(ex.location);
        throw ex;
      }
      finally {
        pageState = 'pushState';
      }
    },

    get currentPage() {
      return current;
    },

    pageChanged: function () {
      pageState = null;
      return this.gotoPath();
    },

    replacePath: function (location) {
      pageState = 'replaceState';
      return this.gotoPath(location);
    },

    gotoPath: function (location) {
      if (typeof location === 'string') {
        var page = location;
        location = {pathname: location};
      } else {
        if (location == null) {
          location = document.location;
        } else if (! ('pathname' in location)) {
          return this.gotoPage(location);
        }
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
        newPage = (('routes' in page) && page.routes[part]) || page.defaultPage;
        if (! newPage) {
          break;
        }
        page = newPage;
      }

      if (newPage && newPage === root.defaultPage)
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
  if (! route || ! route.parent) return AppRoute.pathPrefix || '';
  return routePath(route.parent)+'/'+route.path;
}

function exitEntry(exit, entry, page, location) {
  var entryLen = entry.length;
  var diff = exit.length - entryLen;
  var index = 0;

  for(;index < diff; ++index) {
    exit[index].onBaseExit(page, location);
  }

  for(;index - diff < entryLen; ++index) {
    var exitItem = exit[index];
    if (exitItem === entry[index - diff]) break;
    exitItem.onBaseExit(page, location);
  }

  for(index = index - diff - 1 ; index >= 0; --index) {
    entry[index].onBaseEntry(page, location);
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
      if (! App.userId() && options.privatePage) {
        AppRoute.gotoPage(AppRoute.SignPage);
        return false;
      }
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
    if (options.focus) {
      Bart.focus(template._renderedPage, options.focus);
    }
  };
}

function onExitFunc(template) {
  return function () {
    Bart.remove(template._renderedPage || document.getElementById(template.name));
  };
}
