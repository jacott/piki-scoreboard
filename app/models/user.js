define((require, exports, module) => {
  const koru            = require('koru');
  const Val             = require('koru/model/validation');
  const util            = require('koru/util');
  const Org             = require('./org');
  const Model           = require('model');
  const Role            = require('models/role');

  const ROLE = {
    superUser: 's',
    spectator: 'p',
    climber: 'c',
    judge: 'j',
    admin: 'a',
  };

  class User extends Model.BaseModel {
    static isGuest() {
      return koru.userId() === 'guest';
    }

    canAdminister(doc) {return this.canEdit(doc, /[sa]/)}
    canJudge(doc) {return this.canEdit(doc, /[saj]/)}

    emailWithName() {
      return this.name.replace('/<>/', '') + ' <' + this.email + '>';
    }

    static me() {
      const userId = koru.userId();
      if (userId === 'guest') return User.guestUser();
      return userId ? User.findById(userId) : undefined;
    }

    static fetchAdminister(userId, doc) {
      return ifPromise(User.toDoc(userId), (user) => ifPromise(
        user?.canAdminister(doc), (okay) => (Val.allowAccessIf(okay), user)));
    }
  }

  User.ROLE = ROLE;

  User.define({
    module,
    fields: {
      name: {type: 'text', trim: true, required: true, maxLength: 200},
      email: {type: 'text', trim: true, required: true, maxLength: 200,
              inclusion: {allowBlank: true, matches: util.EMAIL_RE},
              normalize: 'downcase', unique: true},
      initials: {type: 'text', trim: true, required: true, maxLength: 3},
    },
  });

  require('koru/env!./user')(User);

  return User;
});
