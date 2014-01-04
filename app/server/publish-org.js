Meteor.publish('Org', function (shortName) {
  var sess = Session.get(this);
  var user = sess.user;

  check(shortName, String);

  var org = AppModel.Org.findOne({shortName: shortName}, {fields: {_id: 1}});
  if (! org) return this.error(new Meteor.Error(404, 'org not found'));

  sess.orgId = org._id;
  org = null;

  sess.addObserver('OrgUsers', AppModel.User.observeOrg_id(sess.orgId, sess.buildUpdater('User', {
    addedQuery: {_id: {$ne: sess.userId}},

    stopped: function () {
      var docs = sess.docs('User');
      var userId = sess.userId;
      for(var id in docs) {
        if (id !== userId)
          sess.removed('User', id);
      }
    }
  })));

  this.onStop(function () {
    sess.removeObserver('OrgUsers');
  });
  this.ready();
});
