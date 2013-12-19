var Tpl = Bart.SignIn;

Tpl.$events({
  'click': function (event) {
    event.$actioned = true;
    console.log('DEBUG click');

  },
});
