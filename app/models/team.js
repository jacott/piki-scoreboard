define(function(require, exports, module) {
  const Model    = require('model');
  const Org      = require('models/org');
  const TeamType = require('./team-type');

  const Team = module.exports = exports = Model.define(module);

  Team.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
    shortName: {type:  'text', trim: true, required: true, maxLength: 5, unique: {scope: 'org_id'}},
    teamType_id: {type: 'belongs_to', required: true},
    org_id: 'belongs_to',
  });

  Team.teamMap = function (list) {
    let map = {};
    list && list.forEach(id => {
      let team = Team.findById(id);
      if (team) map[team.teamType_id] = team;
    });
    return map;
  };

  require('koru/env!./team')(Team);

});
