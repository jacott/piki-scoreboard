define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var koru = require('koru');
  var Event = require('./event');
  var Climber = require('./climber');
  var Category = require('./category');

  var model = require('model').define(module, {

  });

  model.defineFields({
    event_id: 'belongs_to',
    climber_id: 'belongs_to',
    category_ids: 'has_many',
    createdAt: 'auto_timestamp',
  });

  model.registerObserveField('event_id');

  require('koru/env!./competitor')(model);

  return model;
});
