define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var env = require('koru/env');
  var Event = require('./event');
  var Climber = require('./climber');
  var Category = require('./category');

  var model = require('model').define(module, {

  });

  model.defineFields({
    event_id: 'belongs_to',
    climber_id: 'belongs_to',
    category_ids: 'has_many',
    createdAt: 'timestamp',
  });

  require('koru/env!./competitor')(model);

  return model;
});
