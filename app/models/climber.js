define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var koru = require('koru');
  var Org = require('./org');
  var Club = require('./club');

  var model = require('model').define(module, {

  });

  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
    org_id: 'belongs_to',
    club_id: {type: 'belongs_to', required: true},
    dateOfBirth: {type: 'text', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
    gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
    number: {type: 'integer', number: {integer: true, $gt: 0}},
    uploadId: 'text',
    disabled: {type: 'boolean', boolean: 'trueOnly'},
  });

  require('koru/env!./climber')(model);

  return model;
});
