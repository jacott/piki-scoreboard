define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var env = require('koru/env');
  var Org = require('./org');

  var model = require('model').define(module, {

  });

  model.HEAT_FORMAT_REGEX = /^Q{0,3}(:\d+)?(F\d+(:\d+)?){1,3}$/;

  model.defineFields({
    org_id: 'belongs_to',
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    group: {type:  'text', trim: true, required: true, maxLength: 30},
    shortName: {type: 'text', trim: true, required: true, maxLength: 10, normalize: 'upcase'},
    gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
    type: {type: 'text', inclusion: {matches: /^[BL]$/}},
    heatFormat: {type: 'text', inclusion: {matches: model.HEAT_FORMAT_REGEX}},
    minAge: {type: 'number', number: {integer: true, $gt: 0, $lt: 100}},
    maxAge: {type: 'number', number: {integer: true, $gt: 0, $lt: 100}},
  });

  require('koru/env!./category')(model);

  return model;
});
