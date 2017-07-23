define(function(require, exports, module) {
  const koru    = require('koru');
  const Val     = require('koru/model/validation');
  const publish = require('koru/session/publish');
  const Model   = require('model');
  require('models/category');
  require('models/climber');
  require('models/event');
  const Org     = require('models/org');
  require('models/series');
  require('models/team');
  require('models/team-type');
  const User    = require('models/user');


  const orgChildren = ['Climber', 'Event', 'Series', 'Category', 'Team', 'TeamType'];

  koru.onunload(module, () => {publish._destroy('Org')});

  publish({name: 'Org', init(shortName) {
    const {userId} = this;
    Val.ensureString(shortName);
    const org = Org.findBy('shortName', shortName);
    if (! org) return this.error(new koru.Error(404, 'Org not found'));

    const handles = [];

    this.conn.org_id = org._id;

    this.onStop(() => {handles.forEach(handle => {handle.stop()})});

    const sendUpdate = this.sendUpdate.bind(this);
    const sendUser = (doc, was) => {
      if (doc && doc._id === userId) return;
      this.sendUpdate(doc, was);
    };

    handles.push(User.observeOrg_id([org._id], sendUser));
    User.query.where('org_id', org._id).forEach(sendUser);

    orgChildren.forEach(name => {
      const model = Model[name];
      handles.push(model.observeOrg_id([org._id], sendUpdate));
      model.query.where('org_id', org._id).forEach(sendUpdate);
    });

  }});
});
