define(function(require, exports, module) {
  const koru            = require('koru');
  const Query           = require('koru/model/query');
  const publish         = require('koru/session/publish');
  const Org             = require('models/org');
  const Role            = require('models/role');
  const User            = require('models/user');

  koru.onunload(module, () => {publish._destroy('Self')});

  const noEmail = {email: true};
  const canAdministerOrg = (user, org)=>{
    const {role} = Role.readRole(user._id, org._id);

    return role === 's' || role === 'a';
  };


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

    const orgSendUpdate = (doc, undo)=>{
      this.sendUpdate(
        doc, undo,
        doc != null && canAdministerOrg(user, doc)
          ? undefined : noEmail
      );
    };

    // Publish self
    handles.push(User.observeId(user._id, sendUpdate));
    sendUpdate(user);

    // Publish all orgs
    handles.push(Org.onChange(orgSendUpdate));
    Org.query.forEach(orgSendUpdate);
  }});
});
