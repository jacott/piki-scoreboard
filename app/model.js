define((require, exports, module)=>{
  const Model           = require('koru/model');
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const util            = require('koru/util');

  session.DEFAULT_USER_ID = 'guest';
  if (isClient) util.thread.userId = session.DEFAULT_USER_ID;

  Val.register(module, {
    associated: require('koru/model/validators/associated-validator'),
    validate: require('koru/model/validators/validate-validator'),
    inclusion: require('koru/model/validators/inclusion-validator'),
    length: require('koru/model/validators/length-validator'),
    required: require('koru/model/validators/required-validator'),
    text: require('koru/model/validators/text-validator'),
    unique: require('koru/model/validators/unique-validator'),
  });

  return Model;
});
