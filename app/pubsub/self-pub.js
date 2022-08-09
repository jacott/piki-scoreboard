define((require, exports, module) => {
  const koru            = require('koru');
  const AllPub          = require('koru/pubsub/all-pub');
  const ServerConnection = require('koru/session/server-connection');
  const User            = require('models/user');

  const noEmail = {email: true};

  class SelfPub extends AllPub {
    async init() {
      if (this.userId == null) {
        await this.setUserId((await User.guestUser())._id);
      }

      const user = await User.findById(this.userId) ?? (this.userId === 'guest' ? await User.guestUser() : undefined);

      if (user === undefined) throw new koru.Error(404, 'User not found');

      await super.init();

      if (User.isGuest()) {
        this.userOb = undefined;
      } else {
        this.userOb = User.observeId(this.userId, (dc) => {
          this.conn.sendBinary(...ServerConnection.buildUpdate(dc));
        });
        this.conn.added('User', user.attributes);
      }
    }

    stop() {
      super.stop();
      if (this.userOb !== undefined) {
        this.userOb.stop();
        this.userOb = undefined;
      }
    }
  }
  SelfPub.module = module;
  SelfPub.includeModel('Org');

  SelfPub.Union = class extends AllPub.Union {
    loadInitial(encoder, discreteLastSubscribed) {
      return super.loadInitial(
        {addDoc: (doc) => {encoder.addDoc(ServerConnection.filterDoc(doc, noEmail))}},
        discreteLastSubscribed,
      );
    }
  };

  return SelfPub;
});
