Meteor.publish('Org', function (shortName) {
  var sess = Session.get(this);
  var user = sess.user;

  check(shortName, String);

  var org = AppModel.Org.findOne({shortName: shortName});
  if (! org) return this.error(new Meteor.Error(404, 'org not found'));

  addOrg(sess, org.attributes);

  var orgId = org._id;
  org = null;

  sess.addObserver('Org', AppModel.Org.observeId(orgId, {
    changed: function (id, fields) {
      sess.changed('Org', id, fields);
    }
  }));

  this.onStop(function () {
    removeOrg(sess, orgId);
  });
  this.ready();
});


function addOrg (sess, org) {
  if (sess.orgId === org._id) return;
  sess.orgId = org._id;
  sess.notifyOrgChange(sess.orgId);
  if ('AllOrgs' in sess.observers) return;
  sess.added('Org', org._id, org);
}

function removeOrg (sess, orgId) {
  sess.removeObserver('Org');
  if (sess.orgId === null || ! sess.observers) return;
  sess.orgId = null;
  sess.notifyOrgChange(null);
  if ('AllOrgs' in sess.observers) return;
  sess.removed('Org', orgId);
}
