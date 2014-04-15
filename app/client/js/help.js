var $ = Bart.current;
var Tpl = Bart.Help;
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
    Bart.stopEvent();
    Bart.Dialog.close();
  },

  'click a': function (event) {
    var href = this.getAttribute('href') || '';
    if (href.match(/:/))
      return;

    Bart.stopEvent();

    if (href[0] === '#') {
      scrollToTag(href.slice(1));
      return;
    }

    AppRoute.gotoPath(href);
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
  if (Bart.hasClass(event.target, 'link') && ! Bart.hasClass(event.target, 'topics'))
    Meteor.defer(Bart.Dialog.close);
}

function scrollToTag(tag) {
  Bart.removeClass(document.querySelector('#Help section.current'), 'current');

  if (tag) {
    var elm = document.querySelector('#Help [name="'+ tag + '"]');
    Bart.addClass(elm, 'current');
    elm.scrollIntoView(true);
  } else {
    document.getElementById('Help').parentNode.scrollIntoView(true);

  }
}
