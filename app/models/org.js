define(function(require, exports, module) {
  var util = require('koru/util');
  var model = require('model').define(module);

  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200, unique: true},
    email: {type:  'text', trim: true, required: true, maxLength: 200,
            inclusion: {allowBlank: true, matches: util.EMAIL_RE },  normalize: 'downcase'},
    shortName: {type: 'text', trim: true, required: true, maxLength: 10, unique: true},
  });

  require('koru/env!./org')(model);

  return model;
});
