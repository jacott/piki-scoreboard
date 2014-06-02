define(function(require, exports, module) {
  var App    = require('app');
  var Dom    = require('koru/dom');
  var Route = require('koru/ui/route');

  var Tpl = Dom.newTemplate(require('koru/html!./help'));

  var $ = Dom.current;

  var clickCount = 0;

  Tpl.$helpers({
    contents: function () {
      var ol = document.createElement('ol');
      var sections = $.element.parentNode.parentNode.querySelectorAll('section');
      for(var i = 0; i < sections.length; ++i) {
        var elm = sections[i];
        var name = elm.getAttribute('name');
        if (name)
          ol.appendChild(Tpl.ContentLine.$render({tag: '#'+name, desc: elm.firstChild.textContent}));
      }
      return ol;
    },
  });

  Tpl.$events({
    'click [name=close]': function (event) {
      Dom.stopEvent();
      Dom.Dialog.close();
    },

    'click a': function (event) {
      var href = this.getAttribute('href') || '';
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
    $created: function (ctx, elm) {
      clickCount = 0;
      document.addEventListener('click', clicked, true);
    },

    $destroyed: function (ctx, elm) {
      document.removeEventListener('click', clicked, true);
    },
  });


  function clicked(event) {
    if (Dom.hasClass(event.target, 'link') && ! Dom.hasClass(event.target, 'topics'))
      Dom.Dialog.close();
  }

  function scrollToTag(tag) {
    Dom.removeClass(document.querySelector('#Help section.current'), 'current');

    if (tag) {
      var elm = document.querySelector('#Help [name="'+ tag + '"]');
      Dom.addClass(elm, 'current');
      elm.scrollIntoView(true);
    } else {
      document.getElementById('Help').parentNode.scrollIntoView(true);

    }
  }

  return Tpl;
});
