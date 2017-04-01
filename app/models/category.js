define(function(require, exports, module) {
  const koru = require('koru');
  const Val  = require('koru/model/validation');
  const util = require('koru/util');
  const Org  = require('./org');

  const model = require('model').define(module, {

  });

  model.HEAT_FORMAT_REGEX = /^Q{0,10}(:\d+)?(F\d+(:\d+)?){0,3}$/;

  model.defineFields({
    org_id: 'belongs_to',
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    group: {type:  'text', trim: true, required: true, maxLength: 30},
    shortName: {type: 'text', trim: true, required: true, maxLength: 10, normalize: 'upcase'},
    gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
    type: {type: 'text', inclusion: {matches: /^[BL]$/}},
    heatFormat: {type: 'text', inclusion: {matches: model.HEAT_FORMAT_REGEX}},
    minAge: {type: 'integer', number: {integer: true, $gt: 0, $lt: 100}},
    maxAge: {type: 'integer', number: {integer: true, $gt: 0, $lt: 100}},
  });

  require('koru/env!./category')(model);

  return model;
});
