var observers = ['Category', 'Club', 'Event'];

var pubClimberFields = ['name', 'org_id', 'club_id', 'gender', 'number'];

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

  observers.forEach(function (modelName) {
    sess.addObserver(obName(modelName), AppModel[modelName].observeOrg_id(sess.orgId, sess.buildUpdater(modelName, {
      addedQuery: {},

      stopped: stopFunc(modelName),
    })));
  });

  if (! user.canAdminister()) {
    var climberFields = pubClimberFields;
  }

  sess.addObserver(obName('Climber'), AppModel.Climber.observeOrg_id(sess.orgId, sess.buildUpdater('Climber', {
    fields: climberFields,

    addedQuery: {},
    stopped: stopFunc('Climber'),
  }, {})));

  this.onStop(function () {
    sess.removeObserver('OrgUsers');
    observers.forEach(function (modelName) {
      sess.removeObserver(obName(modelName));
    });
    sess.removeObserver(obName('Climber'));
    sess.release();
  });
  this.ready();

  function stopFunc(modelName) {
    return function() {
      var docs = sess.docs(modelName);
      for(var id in docs) {
        sess.removed(modelName, id);
      }
    };
  }
});

function obName(modelName) {
  return 'Org' + modelName + 's';
}
