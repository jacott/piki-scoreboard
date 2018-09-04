define((require, exports, module)=>{
  const Org             = require('./org');
  const Team            = require('./team');

  class Climber extends Team.HasTeam {
    get yearOfBirth() {
      return this.dateOfBirth && this.dateOfBirth.slice(0, 4);
    }
  }

  Climber.define({
    module,
    fields: {
      name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
      org_id: 'belongs_to',
      team_ids: 'has_many',
      dateOfBirth: {type: 'text', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
      gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
      number: {type: 'integer', number: {integer: true, $gt: 0}},
      uploadId: 'text',
      disabled: {type: 'boolean', boolean: 'trueOnly'},
    },
  });

  require('koru/env!./climber')(Climber);

  return Climber;
});
