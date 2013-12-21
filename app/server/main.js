Meteor.startup(function () {
  initDb();
  App.loaded('App.serverReady');
});


function initDb() {
  var user = Meteor.users.findOne();
  if (! user) {
    user = AppModel.User.findOne();
    if (! user) {
      App.SETUP = true;
      var id = Accounts.createUser({email: "su@example.com", password: "secret"});
      delete App.SETUP;
      AppModel.User.docs.insert({_id: id, name: "Super User", initials: "SU", email: "su@example.com", role: 's'});
    }
  }
}
