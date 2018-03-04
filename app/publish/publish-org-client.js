define(function(require, exports, module) {
  const koru            = require('koru');
  const publish         = require('koru/session/publish');
  const Category        = require('models/category');
  const Climber         = require('models/climber');
  const Event           = require('models/event');
  const Org             = require('models/org');
  const Series          = require('models/series');
  const Team            = require('models/team');
  const TeamType        = require('models/team-type');
  const User            = require('models/user');

  const orgChildren = ['Climber', 'Event', 'Series', 'Category', 'TeamType', 'Team'];

  koru.onunload(module, ()=>{publish._destroy('Org')});

  publish({name: 'Org', init(shortName) {
    const org = Org.findBy('shortName', shortName);
    if (org === undefined) return this.error(new koru.Error(404, 'org not found'));

    const me = User.me();

    if (! me.isSuperUser() && me.org_id !== org._id) {
      User.onId(me._id).fromServer().update({org_id: org._id, role: 'g'});
    }

    this.match('User', doc => doc.org_id == null ||
               (doc.org_id === org._id && doc.role != null));

    const matchOrg = doc => org._id === doc.org_id;
    orgChildren.forEach(name => {this.match(name, matchOrg)});

  }});
});
