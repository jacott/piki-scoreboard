var observers = ['Competitor'];

Meteor.publish('Event', function (eventId) {
  var sess = Session.get(this);
  var user = sess.user;

  check(eventId, String);

  var event = AppModel.Event.findOne({_id: eventId}, {fields: {org_id: 1}});
  if (! event) return this.error(new Meteor.Error(404, 'event not found'));
  event = null;

  observers.forEach(function (modelName) {
    sess.addObserver(modelName, AppModel[modelName].observeEvent_id(eventId, sess.buildUpdater(modelName, {
      addedQuery: {},

      stopped: function () {
        var docs = sess.docs(modelName);
        for(var id in docs) {
          sess.removed(modelName, id);
        }
      }
    })));
  });

  this.onStop(function () {
    observers.forEach(function (modelName) {
      sess.removeObserver(modelName);
    });
  });
  this.ready();
});
