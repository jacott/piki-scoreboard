var $ = Bart.current;
var Tpl = Bart.Profile;
var Form = Bart.Form;
var ChangePassword = Tpl.ChangePassword;

var base = AppRoute.root.addBase(Tpl);
base.addTemplate(Tpl.Index, {
  focus: true,
  defaultPage: true,
});

base.addTemplate(Tpl.ChangePassword, {focus: true});

Tpl.$helpers({
  systemSetup: function () {
    var user = $.data();
    if (user && user.isSuperUser()) {
      return Form.pageLink({value: "System setup", template: "SystemSetup"});
    }
  },
});

Tpl.$events({
  'click [name=signOut]': function (event) {
    event.$actioned = true;
    Meteor.logout();
    AppRoute.gotoPage(Bart.Home);
  },
});

Tpl.$extend({
  onBaseEntry: function () {
    document.body.appendChild(Tpl.$autoRender(AppModel.User.me()));
  },

  onBaseExit: function () {
    Bart.removeId('Profile');
  },
});

ChangePassword.$events({
  'submit': function (event) {
    event.$actioned = true;
    var form = event.currentTarget;
    var oldPassword = form.querySelector('[name=oldPassword]').value;
    var newPassword = form.querySelector('[name=newPassword]');

    Bart.addClass(form, 'submitting');

    Accounts.changePassword(oldPassword, newPassword.value, function (error) {
      if (error) {
        Bart.removeClass(form, 'submitting');
        Form.renderError(form, 'oldPassword', 'invalid password.');
      } else {
        AppRoute.history.back();
      }
    });

  },

  'input [name=newPassword],[name=confirm]': function (event) {
    event.$actioned = true;

    var form = event.currentTarget;
    var newPassword = form.querySelector('[name=newPassword]').value;
    var confirm = form.querySelector('[name=confirm]').value;
    var submit = form.querySelector('[type=submit]');

    if (newPassword.length >= 5 && newPassword === confirm)
      submit.removeAttribute('disabled');
    else
      submit.setAttribute('disabled', 'disabled');
  },
});
