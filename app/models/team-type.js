define(function(require, exports, module) {
  const Model = require('model');
  const Org   = require('models/org');

  const TeamType = module.exports = exports = Model.define(module);

  TeamType.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
    org_id: 'belongs_to',
    default: 'boolean',
  });

  require('koru/env!./team-type')(TeamType);

});
