define(function(require, exports, module) {
  const koru    = require('koru');
  const session = require('koru/session');
  const util    = require('koru/util');

  return function (User) {
    const {pretendRole} = module.config();

    if (pretendRole) {
      const desc = Object.getOwnPropertyDescriptor(User.prototype, 'safeRole');
      desc.get = function () {
        return this._id === koru.userId() ? pretendRole : this.attributes.role;
      };
      Object.defineProperty(User.prototype, 'safeRole', desc);
    }

    util.extend(User, {
      forgotPassword(email, callback) {
        session.rpc("User.forgotPassword", email, callback);
      },
    });
  };
});
