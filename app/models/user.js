define(function(require, exports, module) {
  const koru            = require('koru');
  const {BaseModel}     = require('koru/model');
  const Val             = require('koru/model/validation');
  const util            = require('koru/util');
  const Role            = require('models/role');
  const Org             = require('./org');

  const ROLE = {
    superUser: 's',
    spectator: 'p',
    climber: 'c',
    judge: 'j',
    admin: 'a',
  };

  class User extends BaseModel {
    static isGuest() {
      return koru.userId() === 'guest';
    }

    canAdminister(doc) {return this.canEdit(doc, /[sa]/)}
    canJudge(doc) {return this.canEdit(doc, /[saj]/)}

    emailWithName() {
      return this.name.replace('/<>/','')+" <"+this.email+">";
    }

    static me() {
      return koru.userId() && User.findById(koru.userId());
    }

    static fetchAdminister(userId, doc) {
      var user = User.toDoc(userId);
      Val.allowAccessIf(user && user.canAdminister(doc));
      return user;
    }
  }

  User.ROLE = ROLE;

  module.exports = User.define({
    module,
    fields: {
      name: {type:  'text', trim: true, required: true, maxLength: 200},
      email: {type:  'text', trim: true, required: true, maxLength: 200,
              inclusion: {allowBlank: true, matches: util.EMAIL_RE },  normalize: 'downcase' , unique: true},
      initials: {type: 'text', trim: true, required: true, maxLength: 3},
    },
  });

  require('koru/env!./user')(User);

  return User;
});
