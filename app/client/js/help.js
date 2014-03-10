var $ = Bart.current;
var Tpl = Bart.Help;

Tpl.$helpers({
  contents: function () {
    var ol = document.createElement('ol');
    var sections = $.element.parentNode.parentNode.querySelectorAll('section');
    for(var i = 0; i < sections.length; ++i) {
      var elm = sections[i];
      var name = elm.getAttribute('name');
      if (name)
        ol.appendChild(Tpl.ContentLine.$render({tag: name, desc: elm.firstChild.textContent}));
    }
    return ol;
  },
});

Tpl.$events({
  'click [name=close]': function (event) {
    Bart.stopEvent();
    Bart.Dialog.close();
  },

  'click .topics': function (event) {
    Bart.stopEvent();
    var elm = document.querySelector('#Help section[name="'+$.data(this).tag + '"]');
    Bart.removeClass(document.querySelector('#Help section.current'), 'current');
    Bart.addClass(elm, 'current');
    elm.scrollIntoView(true);
  },
});

Tpl.$extend({
  $created: function (ctx, elm) {
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
