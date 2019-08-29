define((require, exports, module)=>{
  const Changes         = require('koru/changes');
  const Val             = require('koru/model/validation');
  const Model           = require('model');
  const Org             = require('./org');

  const HEAT_FORMAT_REGEX = /^Q{0,10}(:\d+)?(F\d+(:\d+)?){0,3}$/;
  const HEAT_FORMAT_REGEXS = {
    L: HEAT_FORMAT_REGEX,
    B: HEAT_FORMAT_REGEX,
    S: /^C?[1-4]*$/,
  };

  class Category extends Model.BaseModel {
    get heatFormatRegex() {return HEAT_FORMAT_REGEXS[this.type]}
  }

  Category.define({module, fields: {
    org_id: 'belongs_to',
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    group: {type:  'text', trim: true, required: true, maxLength: 30},
    shortName: {type: 'text', trim: true, required: true, maxLength: 10, normalize: 'upcase'},
    gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
    type: {type: 'text', inclusion: {matches: /^[BLS]$/}},
    heatFormat: {type: 'text', validate() {
      if (this.$hasChanged('heatFormat') || this.$hasChanged('type')) {
        const value = this.heatFormat;
        if (this.type !== 'S') {
          if (! value || ! HEAT_FORMAT_REGEX.test(value))
            Val.addError(this, 'heatFormat', 'is_invalid');
        } else {
          if (value)  {
            Val.addError(this, 'heatFormat', 'not_allowed');
          } else if (value !== undefined)
            this.heatFormat = undefined;
        }
      }
    }},
    minAge: {type: 'integer', number: {integer: true, $gt: 0, $lt: 100}},
    maxAge: {type: 'integer', number: {integer: true, $gt: 0, $lt: 100}},
  }});

  Category.HEAT_FORMAT_REGEX = HEAT_FORMAT_REGEX;

  require('koru/env!./category')(Category);

  return Category;
});
