define(function(require, exports, module) {
  var Model = require('koru/model');
  var Val = require('koru/model/validation');
  var koru = require('koru');

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
