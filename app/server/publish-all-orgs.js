Meteor.publish('SU', function () {
  var sess = Session.get(this);
  var user = sess.user;

  var addedQuery = {};

  if (sess.orgId)
    addedQuery._id = {$ne: sess.orgId};

  sess.addObserver('AllOrgs', AppModel.Org.observeAny(sess.buildUpdater('Org', {
    addedQuery: addedQuery,

    stopped: function () {
      var docs = sess.docs('Org');
      var orgId = sess.orgId;
      for(var id in docs) {
        if (id !== orgId)
          sess.removed('Org', id);
      }
    }
  })));

  var orgUsersHandler = sess.onOrgChange(orgChange);
  orgChange(sess.orgId);

  this.onStop(function () {
    orgUsersHandler && orgUsersHandler.stop();
    sess.removeObserver('AllOrgs', 'OrgUsers');
  });
  this.ready();

  function orgChange(orgId) {
    sess.removeObserver('OrgUsers');
    if (! orgId) return;
    sess.addObserver('OrgUsers', AppModel.User.observeOrg_id(orgId, sess.buildUpdater('User', {
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
  }
});
