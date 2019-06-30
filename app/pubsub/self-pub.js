define((require, exports, module)=>{
  const koru            = require('koru');
  const AllPub          = require('koru/pubsub/all-pub');
  const ServerConnection = require('koru/session/server-connection');
  const User            = require('models/user');

  const noEmail = {email: true};

  class SelfPub extends AllPub {
    init() {
      if (this.userId == null) this.userId = User.guestUser()._id;

      const user = User.findById(this.userId);

      if (user === void 0)
        throw new koru.Error(404, 'User not found');

      super.init();

      if (User.isGuest()) {
        this.userOb = void 0;
      } else {
        this.userOb = User.observeId(this.userId, dc =>{
          this.conn.sendBinary(...ServerConnection.buildUpdate(dc));
        });
        this.conn.added('User', user.attributes);
      }
    }

    stop() {
      super.stop();
      if (this.userOb !== void 0) {
        this.userOb.stop();
        this.userOb = void 0;
      }
    }
  }
  SelfPub.module = module;
  SelfPub.includeModel('Org');

  SelfPub.Union = class extends AllPub.Union {
    loadInitial(encoder, discreteLastSubscribed) {
      super.loadInitial(
        {addDoc: doc =>{encoder.addDoc(ServerConnection.filterDoc(doc, noEmail))}},
        discreteLastSubscribed
      );
    }
  };

  return SelfPub;
});
