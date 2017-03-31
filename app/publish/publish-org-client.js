define(function(require, exports, module) {
  const koru     = require('koru');
  const publish  = require('koru/session/publish');
  const Category = require('models/category');
  const Climber  = require('models/climber');
  const Event    = require('models/event');
  const Org      = require('models/org');
  const Series   = require('models/series');
  const Team     = require('models/team');
  const TeamType = require('models/team-type');

  var orgChildren = ['User', 'Climber', 'Event', 'Series', 'Category', 'TeamType', 'Team'];

  koru.onunload(module, function () {
    publish._destroy('Org');
  });

  publish({name: 'Org', init(shortName) {
    const org = Org.findBy('shortName', shortName);
    if (! org) return this.error(new koru.Error(404, 'org not found'));

    orgChildren.forEach(name => {this.match(name, matchOrg)});

    function matchOrg(doc) {return org._id === doc.org_id}
  }});
});
