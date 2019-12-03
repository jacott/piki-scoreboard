define(function(require, exports, module) {
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const DomTemplate     = require('koru/dom/template');
  const md5sum          = require('koru/md5sum');
  const Random          = require('koru/random');
  const session         = require('koru/session');
  const Dialog          = require('koru/ui/dialog');
  const Route           = require('koru/ui/route');
  const SelectMenu      = require('koru/ui/select-menu');
  const UserAccount     = require('koru/user-account');
  const ClientLogin     = require('koru/user-account/client-login');
  const util            = require('koru/util');
  const uColor          = require('koru/util-color');
  const Org             = require('models/org');
  const User            = require('models/user');
  const Flash           = require('ui/flash');
  const Help            = require('ui/help');
  const NotifyBar       = require('ui/notify-bar');
  const App             = require('./app-base');

  const Tpl = Dom.newTemplate(require('koru/html!./header'));
  const $ = Dom.current;

  const getUser = ()=>{
    const user = User.me();
    if (user && user._id !== 'guest')
      return user;
  };

  Tpl.$helpers({
    style() {
      const user = getUser();
      return user && user.email ?
        `background-image:url(${App.AVATAR_URL}${md5sum(user.email)}?d=blank` : '';
    },

    initials() {
      const user = getUser();
      return user && user.initials;
    },

    nameClass() {
      const user = getUser();
      if (user) {
        const initials = user.initials;
        Dom.setClass('long', initials.length > 2);
      }
    },

    color() {
      const user = getUser();
      if (user) {
        const rnd = new Random(user.email);

        const color = uColor.rgb2hex(uColor.hsl2rgb({
          h: rnd.fraction(), s: 1 - rnd.fraction()/2, l: 0.5}));
        $.element.style.backgroundColor = color;
        App.addColorClass($.element, color);
      }
    },
  });

  Tpl.$events({
    'menustart [name=avatar]'(event) {
      const list = [
        ['$signOut', 'Sign out'],
        ['$signOutOther', 'Sign out of other sessions'],
        ['profile', 'Profile'],
      ];

      SelectMenu.popup(this, {
        list,
        onSelect,
        align: 'right',
      });
    },

    'menustart [name=menu]'(event) {
      const list = [];
      const ev = Dom.tpl.Event.event;
      if (ev) {
        list.push([`event/${ev._id}/show`, ev.displayName]);
      }
      list.push(['event', 'Calendar']);
      list.push('disabled sep');
      const me = User.me();

      if (me && koru.userId() !== 'guest' && (
        me.isSuperUser() || (
          me.org !== undefined &&
            me.org.shortName === Route.currentPageRoute.orgSN && me.isAdmin()))) {
        list.push(['system-setup', 'Org settings']);
      }
      list.push(['choose-org', 'Go to another org']);
      (koru.userId() && koru.userId() !== 'guest') ||
        list.push(['sign-in', 'Sign in']);

      list.push('disabled sep');
      list.push(
        ['category', 'Categories'],
        ['climber', 'Climbers'],
        ['team', 'Teams']
      );
      list.push('disabled sep');
      list.push(['$help', 'Help']);

      SelectMenu.popup(this, {
        list,
        onSelect,
        align: 'right',
      });
    },
  });

  const Actions = {
    $signOut() {
      UserAccount.logout();
    },

    $signOutOther() {
      UserAccount.logoutOtherClients(function (error) {
        if (error)
          Flash.error('Unexpected error.');
        else
          Flash.notice('You have been signed out of any other sessions.');
      });
    },

    $help() {
      Dialog.open(Help.$autoRender({}));
    },
  };

  function onSelect(elm) {
    const id = $.data(elm)._id;
    const action = Actions[id];
    if (action)
      action(elm);
    else
      Route.gotoPath(id);
    return true;
  }

  Tpl.$extend({
    $created(ctx, elm) {
      ctx.onDestroy(ClientLogin.onChange(session, state => {
        if (state === 'ready') {
          const uid = koru.userId();
          ctx.userObserve && ctx.userObserve.stop();
          const updateAll = () => {
            App.setAccess();
            ctx.updateAllTags();

            Route.currentPage instanceof DomTemplate
              && Route.replacePage(Route.currentPage, Route.currentPageRoute);
          };

          ctx.userObserve = User.observeId(uid, updateAll);
          updateAll();
        }
      }));
      ctx.orgSN = null;
      ctx.onDestroy(Route.onChange(() => {
        const {orgSN} = Route.currentPageRoute;
        if (ctx.orgSN !== orgSN) {
          ctx.orgSN = orgSN;
          document.getElementById('HeaderOrgName').textContent =
            (Org.findBy('shortName', orgSN)||{}).name || '';
        }
      }));

      elm.getElementsByClassName('notifyBarContainer')[0].appendChild(NotifyBar.$autoRender());
    },

    $destroyed(ctx) {
      ctx.userObserve && ctx.userObserve.stop();
    },

    show() {
      Dom.removeId('Header');
      document.body.insertBefore(Tpl.$autoRender({}), document.body.firstChild);
    },
  });

  Dom.setTitle = title => {
    const pageTitle = document.getElementById('PageTitle');

    const pageRoute = Route.currentPageRoute;
    const page = Route.currentPage;
    let prev = page;
    if (! title || title === 'Piki') {
      title = null;
      for (let tpl = page; tpl; prev = tpl, tpl = tpl.parent) {
        if (tpl.title) {
          title = tpl.title;
          break;
        }
      }
      if (! title)
        title = prev ? util.capitalize(util.humanize(prev.name)) : "Piki";
    }

    if (pageTitle && pageTitle.textContent !== title) {
      pageTitle.textContent = title;
    }

    if (page && page.titleSuffix)
      title = `${title} - ${page.titleSuffix}`;

    return `Piki ${(pageRoute && pageRoute.orgSN) || ''}: ${title}`;
  };

  return Tpl;
});
