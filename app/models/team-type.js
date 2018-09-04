define((require, exports, module)=>{
  const Model = require('model');
  const Org   = require('models/org');

  class TeamType extends Model.BaseModel {
  }

  TeamType.define({module, fields: {
    name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
    org_id: 'belongs_to',
    default: 'boolean',
  }});

  require('koru/env!./team-type')(TeamType);

  return TeamType;
});
