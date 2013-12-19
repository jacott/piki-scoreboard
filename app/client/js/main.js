var Tpl = Bart.Main;

App._startup = function () {
  document.head.appendChild(Tpl.Head.$render({}));
  document.body.appendChild(Tpl.$render({}));
};

Tpl.$helpers({
  signIn: Bart.autoElm(Bart.SignIn),
});




Meteor.startup(App._startup);
