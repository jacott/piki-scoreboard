define((require, exports, module)=>{
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const localStorage    = require('koru/local-storage');
  const session         = require('koru/session');
  const sessState       = require('koru/session/state');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const uColor          = require('koru/util-color');
  const Org             = require('models/org');
  const User            = require('models/user');
  const OrgSub          = require('pubsub/org-sub');
  const SelfSub         = require('pubsub/self-sub');
  const ResourceString  = require('resource-string');
  const header          = require('ui/header');
  const Loading         = require('ui/loading');
  const App             = require('./app-base');

  let selfSub, orgSub, orgShortName = null, sessStateChange;

  const isTouch = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
        .test(navigator.userAgent.toLowerCase());


  koru.onunload(module, 'reload');

  util.merge(App, {
    restrictAccess(Tpl, rolere=/[as]/) {
      let orig;
      const override = (page, pageRoute, callback)=>{
        if (koru.userId() == null || User.isGuest() || ! rolere.test(User.me().safeRole)) {
          Route.abortPage(Route.root.defaultPage);
          return;
        }

        orig == null || orig.call(Tpl, page, pageRoute, callback);
      };
      if (Tpl.onEntry == null) {
        orig = Tpl.onBaseEntry;
        Tpl.onBaseEntry = override;
      } else {
        orig = Tpl.onEntry;
        Tpl.onEntry = override;
      }
    },
    AVATAR_URL: 'https://secure.gravatar.com/avatar/',

    text: ResourceString.text,

    stop() {
      orgSub && orgSub.stop();
      selfSub && selfSub.stop();
      sessStateChange && sessStateChange.stop();
      selfSub = orgSub = orgShortName = null;

      window.removeEventListener('popstate', pageChanged);
    },

    start() {
      App.stop();
      window.addEventListener('popstate', pageChanged);
      App.setAccess();
      selfSub = SelfSub.subscribe(null, err =>{
        err !== null && ! (err.error < 500) && koru.unhandledException(err);
        Dom.removeClass(document.body, 'loading');
        Route.replacePath(koru.getLocation());
      });
      header.show();
    },

    addColorClass(elm, color) {
      const cc = uColor.colorClass(color);

      if (Dom.hasClass(elm, cc)) return;

      Dom.removeClass(elm, 'dark');
      Dom.removeClass(elm, 'verydark');
      Dom.removeClass(elm, 'light');
      Dom.removeClass(elm, 'verylight');

      Dom.addClass(elm, cc);
    },

    _setOrgShortName(value) {
      orgShortName = value;
    }
  });

  Route.root.routeVar = 'orgSN';
  Route.root.async = true;

  Route.root.onBaseEntry = (page, pageRoute, callback)=>{
    if (pageRoute.orgSN === undefined)
      pageRoute.orgSN = localStorage.getItem('orgSN') || null;

    if (pageRoute.orgSN == null && page !== Dom.tpl.ChooseOrg)
      Route.abortPage('choose-org');

    if (pageRoute.orgSN !== orgShortName &&
        pageRoute.orgSN !== 'choose-org') {
      subscribeOrg(pageRoute.orgSN, callback);
    } else
      callback();
  };

  Route.root.onBaseExit = ()=>{subscribeOrg(null)};

  const pageChanged = (event)=>{Route.pageChanged()};

  const subscribeOrg = (shortName, callback)=>{
    App.setAccess();
    if (shortName && App.orgId != null) {
      const doc = Org.findById(App.orgId);
      if (doc && doc.shortName === shortName) {
        callback && callback();
        return;
      }
    }
    orgSub && orgSub.stop();
    if (shortName) {
      orgShortName = shortName;
      App.orgId = null;
      const org = Org.findBy('shortName', shortName);
      if (org === void 0) {
        koru.globalErrorCatch(new koru.Error(404, 'Org not found: '+shortName));
        callback();
        return;
      }

      orgSub = OrgSub.subscribe(org._id, (err)=>{
        Loading.done();
        if (err != null && err.error !== 409) {
          koru.globalErrorCatch(err);
          subscribeOrg();
          return;
        }
        const doc = Org.findBy('shortName', orgShortName);
        if (doc === void 0) {
          subscribeOrg();
          return;
        }
        localStorage.setItem('orgSN', orgShortName);
        App.orgId = doc._id;
        App.setAccess();
        Dom.addClass(document.body, 'inOrg');
        callback();
      });

    } else {
      orgSub = orgShortName = App.orgId = null;
      Dom.removeClass(document.body, 'inOrg');
      callback && callback();
    }
  };

  const rippleElm = Dom.h({div: {}, class: 'ripple'});

  const ripple = (event)=>{
    const button = event.target;
    if (button.tagName !== 'BUTTON' && ! Dom.hasClass(button, 'ripple-button')) return;

    Dom.removeClass(rippleElm, 'animate');
    Dom.removeClass(rippleElm, 'ripple-finished');
    const rect = button.getBoundingClientRect();
    const activeElement = document.activeElement;

    let st = rippleElm.style;
    st.width = rect.width + 'px';
    st.height = rect.height + 'px';
    st = rippleElm.firstChild.style;
    if (! st) return;
    const rippleSize = Math.sqrt(rect.width * rect.width +
                               rect.height * rect.height) * 2 + 2;
    st.width = rippleSize + 'px';
    st.height = rippleSize + 'px';
    const translate = 'translate(-50%, -50%) ' +
          'translate(' + (event.clientX - rect.left) + 'px, ' + (event.clientY - rect.top) + 'px)';
    st[Dom.vendorTransform] = translate + ' scale(0.0001, 0.0001)';

    button.insertBefore(rippleElm, button.firstChild);
    Dom.nextFrame(()=>{
      Dom.addClass(rippleElm, 'animate');
      st[Dom.vendorTransform] = translate;
    });

    const removeRipple = (event)=>{
      document.removeEventListener('pointerup', removeRipple, true);

      // Allow a repaint to occur before removing this class, so the animation
      // shows for tap events, which seem to trigger a pointerup too soon after
      // pointerdown.
      Dom.nextFrame(()=>{Dom.addClass(rippleElm, 'ripple-finished')});
    };

    document.addEventListener('pointerup', removeRipple, true);

  };
  document.addEventListener('pointerdown', ripple, true);

  return App;
});
