var Tpl = Bart.Main;

App._startup = function () {
  document.head.appendChild(Tpl.Head.$render({}));
  document.body.appendChild(Tpl.$render({}));
};

Meteor.startup(App._startup);
