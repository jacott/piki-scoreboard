define((require, exports, module)=>{
  const util            = require('koru/util');
  const Model           = require('model');

  class Org extends Model.BaseModel {
  }

  Org.define({
    module,
    fields: {
      name: {type:  'text', trim: true, required: true, maxLength: 200, unique: true},
      email: {type:  'text', trim: true, required: true, maxLength: 200,
              inclusion: {allowBlank: true, matches: util.EMAIL_RE },  normalize: 'downcase'},
      shortName: {type: 'text', trim: true, required: true, maxLength: 10, unique: true},
    }});

  require('koru/env!./org')(Org);

  return Org;
});
