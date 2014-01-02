Meteor.publish('AllOrgs', function () {
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

  this.onStop(function () {
    if (! sess.observers) return;
    var ob = sess.observers.AllOrgs;
    delete sess.observers.AllOrgs;
    ob && ob.stop();
  });
  this.ready();
});
