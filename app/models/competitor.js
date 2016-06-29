define(function(require, exports, module) {
  const koru     = require('koru');
  const Val      = require('koru/model/validation');
  const util     = require('koru/util');
  const Team     = require('models/team');
  const Category = require('./category');
  const Climber  = require('./climber');
  const Event    = require('./event');
  const model    = require('model').define(module, {

  });

  model.defineFields({
    event_id: 'belongs_to',
    climber_id: 'belongs_to',
    team_ids: 'has_many',
    category_ids: 'has_many',
    createdAt: 'auto_timestamp',
  });

  model.registerObserveField('event_id');

  require('koru/env!./competitor')(model);

  return model;
});
