define(function(require, exports, module) {
  const koru        = require('koru');
  const {BaseModel} = require('koru/model');
  const util        = require('koru/util');
  const Org         = require('./org');
  const Team        = require('./team');

  class Climber extends BaseModel {
    get yearOfBirth() {
      return this.dateOfBirth && this.dateOfBirth.slice(0, 4);
    }
    get teamMap() {
      let map = this.$cache.teamMap;
      if (! map) {
        map = this.$cache.teamMap = Team.teamMap(this.team_ids);
      }
      return map;
    }

    team(teamType_id) {
      return this.teamMap[Climber.toId(teamType_id)];
    }
  }

  module.exports = Climber.define({
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
});
