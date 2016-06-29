define(function(require, exports, module) {
  var publish = require('koru/session/publish');
  var koru = require('koru');
  var Org = require('models/org');
  require('models/club');
  require('models/team');
  require('models/team-type');
  require('models/climber');
  require('models/event');
  require('models/category');

  var orgChildren = ['User', 'Club', 'Climber', 'Event', 'Category', 'TeamType', 'Team'];

  koru.onunload(module, function () {
    publish._destroy('Org');
  });

  publish('Org', function (shortName) {
    var sub = this;

    var org = Org.findBy('shortName', shortName);
    if (! org) return sub.error(new koru.Error(404, 'org not found'));

    orgChildren.forEach(function (name) {
      sub.match(name, matchOrg);
    });

    function matchOrg(doc) {
      return org._id === doc.org_id;
    }
  });
});
