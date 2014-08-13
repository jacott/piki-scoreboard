define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var koru = require('koru');
  var Org = require('./org');
  var User = require('./user');

  var model = require('model').define(module, {

  });

  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200,
           unique: {scope: 'org_id'}},
    shortName: {type: 'text', trim: true, required: true, maxLength: 10,
                normalize: 'upcase', unique: {scope: 'org_id'}},
    org_id: 'belongs_to',
    contact_id: {type: 'belongs_to', modelName: 'User'}
  });

  require('koru/env!./club')(model);

  return model;
});
