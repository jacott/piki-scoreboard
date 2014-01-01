Meteor.publish('AllOrgs', function () {
  var sess = Session.get(this);
  var user = sess.user;

  sess.addObserver('AllOrgs', AppModel.Org.observeAny(sess.buildUpdater('Org', {
    addedQuery: {},

    stopped: function () {
      var docs = sess.docs('Org');
      for(var id in docs) {
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
