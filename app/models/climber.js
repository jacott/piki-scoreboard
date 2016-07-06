define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var koru = require('koru');
  var Org = require('./org');
  const Team = require('./team');

  var model = require('model').define(module, {
    get yearOfBirth() {return this.dateOfBirth && this.dateOfBirth.slice(0, 4)},
  });

  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
    org_id: 'belongs_to',
    team_ids: 'has_many',
    dateOfBirth: {type: 'text', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
    gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
    number: {type: 'integer', number: {integer: true, $gt: 0}},
    uploadId: 'text',
    disabled: {type: 'boolean', boolean: 'trueOnly'},
  });

  util.extend(model.prototype, {
    get teamMap() {
      let map = this.$cache.teamMap;
      if (! map) {
        map = this.$cache.teamMap = Team.teamMap(this.team_ids);
      }
      return map;
    },

    team(teamType_id) {
      return this.teamMap[model.toId(teamType_id)];
    },
  });

  require('koru/env!./climber')(model);

  return model;
});
