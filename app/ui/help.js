define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Route           = require('koru/ui/route');
  const App             = require('./app-base');

  const Tpl = Dom.newTemplate(require('koru/html!./help'));
  const $ = Dom.current;

  let clickCount = 0;

  const clicked = (event)=>{
    if (Dom.hasClass(event.target, 'link') && ! Dom.hasClass(event.target, 'topics'))
      Dom.tpl.Dialog.close();
  };

  const scrollToTag = (tag)=>{
    Dom.removeClass(document.querySelector('#Help section.current'), 'current');

    if (tag) {
      var elm = document.querySelector('#Help [name="'+ tag + '"]');
      Dom.addClass(elm, 'current');
      elm.scrollIntoView(true);
    } else {
      document.getElementById('Help').parentNode.scrollIntoView(true);

    }
  };

  Tpl.$helpers({
    contents() {
      const ol = document.createElement('ol');
      const sections = $.element.parentNode.parentNode.querySelectorAll('section');
      for(let i = 0; i < sections.length; ++i) {
        const elm = sections[i];
        const name = elm.getAttribute('name');
        if (name)
          ol.appendChild(Tpl.ContentLine.$render({tag: '#'+name, desc: elm.firstChild.textContent}));
      }
      return ol;
    },
  });

  Tpl.$events({
    'click [name=close]'(event) {
      Dom.stopEvent();
      Dom.tpl.Dialog.close();
    },

    'click a'(event) {
      const href = this.getAttribute('href') || '';
      if (href.match(/:/))
        return;

      Dom.stopEvent();

      if (href[0] === '#') {
        scrollToTag(href.slice(1));
        return;
      }

      Route.gotoPath(href);
    },
  });

  Tpl.$extend({
    $created(ctx, elm) {
      clickCount = 0;
      document.addEventListener('click', clicked, true);
    },

    $destroyed(ctx, elm) {
      document.removeEventListener('click', clicked, true);
    },
  });

  return Tpl;
});
