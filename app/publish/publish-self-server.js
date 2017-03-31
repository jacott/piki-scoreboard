define(function(require, exports, module) {
  const koru    = require('koru');
  const Query   = require('koru/model/query');
  const publish = require('koru/session/publish');
  const Org     = require('models/org');
  const User    = require('models/user');

  koru.onunload(module, () => {publish._destroy('Self')});

  publish({name: 'Self', init() {
    if (! this.userId) {
      this.setUserId(User.guestUser()._id);
      return;
    }
    const user = User.findById(this.userId);

    if (! user) {
      this.error(new koru.Error(404, 'User not found'));
      return;
    }

    const handles = [];

    this.onStop(() => {handles.forEach(handle => {handle.stop()})});

    const sendUpdate = this.sendUpdate.bind(this);

    // Publish self
    handles.push(User.observeId(user._id, sendUpdate));
    sendUpdate(user);

    // Publish all orgs
    handles.push(Org.onChange(sendUpdate));
    Org.query.forEach(sendUpdate);
  }});
});
