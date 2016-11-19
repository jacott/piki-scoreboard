define(function(require, exports, module) {
  const koru           = require('koru');
  const Dom            = require('koru/dom');
  const format         = require('koru/format');
  const localStorage   = require('koru/local-storage');
  const session        = require('koru/session');
  const sessState      = require('koru/session/state');
  const Route          = require('koru/ui/route');
  const util           = require('koru/util');
  const Org            = require('models/org');
  const User           = require('models/user');
  require('publish/publish-event');
  require('publish/publish-org');
  require('publish/publish-self');
  const ResourceString = require('resource-string');
  const Flash          = require('ui/flash');
  const header         = require('ui/header');
  const Spinner        = require('ui/spinner');
  const App            = require('./app-base');
  const Disconnected   = require('./disconnected');
  require('./home');

  var selfSub, orgSub, orgShortName, pathname, sessStateChange;

  const isTouch = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
        .test(navigator.userAgent.toLowerCase());


  koru.onunload(module, 'reload');

  util.extend(App, {
    text(text) {
      var m = /^([^:]+):(.*)$/.exec(text);
      if (m) {
        var fmt = ResourceString.en[m[1]];
        if (fmt) {
          return format(fmt, m[2].split(':'));
        }
      }
      return ResourceString.en[text] || text;
    },

    subscribe: require('koru/session/subscribe'),

    stop() {
      orgSub && orgSub.stop();
      selfSub && selfSub.stop();
      sessStateChange && sessStateChange.stop();
      selfSub = orgSub = orgShortName = pathname = null;

      window.removeEventListener('popstate', pageChanged);
    },

    start() {
      App.stop();
      sessStateChange = sessState.onChange(connectChange);
      Spinner.init();
      pathname = [koru.getLocation()];
      App.setAccess();
      selfSub = App.subscribe('Self', function (err) {
        Dom.removeClass(document.body, 'loading');
        window.addEventListener('popstate', pageChanged);
        pathname && Route.replacePath(pathname[0] || document.location, pathname[1]);
      });
      header.show();
    },

    _setOrgShortName(value) {
      orgShortName = value;
    }
  });

  Route.root.routeVar = 'orgSN';
  Route.root.onBaseEntry = function (page, pageRoute) {
    if (pageRoute.orgSN === undefined)
      pageRoute.orgSN = localStorage.getItem('orgSN') || null;

    if (pageRoute.orgSN !== orgShortName) {
      subscribeOrg(pageRoute.orgSN);
    }
  };

  Route.root.onBaseExit = function () {
    subscribeOrg(null);
  };

  function connectChange(state) {
    if (state)
      Dom.removeId('Disconnected');
    else
      document.body.appendChild(Disconnected.$autoRender({}));
  }

  function pageChanged(event) {
    Route.pageChanged();
  }

  function subscribeOrg(shortName) {
    App.setAccess();
    orgSub && orgSub.stop();
    if (shortName) {
      orgShortName = shortName;
      App.orgId = null;

      orgSub = App.subscribe('Org', orgShortName, function (err) {
        Dom.removeId('Flash');
        if (err) {
          koru.globalErrorCatch(err);
          subscribeOrg();
          return;
        }
        var doc = Org.findBy('shortName', orgShortName);
        if (! doc) {
          subscribeOrg();
          return;
        }
        localStorage.setItem('orgSN', orgShortName);
        App.orgId = doc._id;
        App.setAccess();
        Dom.addClass(document.body, 'inOrg');
        var orgLink = document.getElementById('OrgHomeLink');
        if (orgLink) orgLink.textContent = doc.name;
        if (pathname) {
          var pn = pathname;
          pathname = null;
          Route.replacePath(pn[0], pn[1]);
        }
        Dom.Event.startPage();
      });

      Flash.loading();

      if (Route.loadingArgs) {
        pathname = Route.loadingArgs;
        Route.abortPage();
      }

    } else {
      orgSub = orgShortName = App.orgId = pathname = null;
      Dom.removeClass(document.body, 'inOrg');
      var orgLink = document.getElementById('OrgHomeLink');
      if (orgLink) orgLink.textContent = "Choose Organization";
    }
  }

  document.addEventListener(isTouch ? 'touchstart' : 'mousedown', ripple, true);
  var rippleElm = Dom.h({div: {}, class: 'ripple'});

  function ripple(event) {
    var button = event.target;
    if (button.tagName !== 'BUTTON' && ! Dom.hasClass(button, 'ripple-button')) return;

    Dom.removeClass(rippleElm, 'animate');
    Dom.removeClass(rippleElm, 'ripple-finished');
    var rect = button.getBoundingClientRect();
    var activeElement = document.activeElement;

    var st = rippleElm.style;
    st.width = rect.width + 'px';
    st.height = rect.height + 'px';
    st = rippleElm.firstChild.style;
    if (! st) return;
    var rippleSize = Math.sqrt(rect.width * rect.width +
                               rect.height * rect.height) * 2 + 2;
    st.width = rippleSize + 'px';
    st.height = rippleSize + 'px';
    var translate = 'translate(-50%, -50%) ' +
          'translate(' + (event.clientX - rect.left) + 'px, ' + (event.clientY - rect.top) + 'px)';
    st[Dom.vendorTransform] = translate + ' scale(0.0001, 0.0001)';

    button.insertBefore(rippleElm, button.firstChild);
    Dom.nextFrame(function () {
      Dom.addClass(rippleElm, 'animate');
      st[Dom.vendorTransform] = translate;
    });

    document.addEventListener('mouseup', removeRipple, true);

    function removeRipple(event) {
      document.removeEventListener('mouseup', removeRipple, true);

      // Allow a repaint to occur before removing this class, so the animation
      // shows for tap events, which seem to trigger a mouseup too soon after
      // mousedown.
      Dom.nextFrame(function() {
        Dom.addClass(rippleElm, 'ripple-finished');
      });

    }
  }



  return App;
});
