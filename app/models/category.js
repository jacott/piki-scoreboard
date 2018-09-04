define((require, exports, module)=>{
  const Model           = require('model');
  const Org             = require('./org');

  const HEAT_FORMAT_REGEX = /^Q{0,10}(:\d+)?(F\d+(:\d+)?){0,3}$/;

  class Category extends Model.BaseModel {
  }

  Category.define({module, fields: {
    org_id: 'belongs_to',
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    group: {type:  'text', trim: true, required: true, maxLength: 30},
    shortName: {type: 'text', trim: true, required: true, maxLength: 10, normalize: 'upcase'},
    gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
    type: {type: 'text', inclusion: {matches: /^[BL]$/}},
    heatFormat: {type: 'text', inclusion: {matches: HEAT_FORMAT_REGEX}},
    minAge: {type: 'integer', number: {integer: true, $gt: 0, $lt: 100}},
    maxAge: {type: 'integer', number: {integer: true, $gt: 0, $lt: 100}},
  }});

  Category.HEAT_FORMAT_REGEX = HEAT_FORMAT_REGEX;

  require('koru/env!./category')(Category);

  return Category;
});
