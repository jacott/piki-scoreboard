define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var env = require('koru/env');
  var Model = require('model');

  var model = Model.define(module, {
    get parentSubject () {
      var pm = Model[this.parent];
      return new pm(pm.attrFind(this.parent_id));
    }
  });

  model.defineFields({
    createdAt: 'timestamp',
    model: 'modelName',
    model_id: 'modelId',
    parent: 'modelName',
    parent_id: 'modelId',
    type: 'text',
    before: 'text',
    after: 'text',
    aux: 'text',
  });

  // Handle circular dependency
  require(['./user', './org'], function () {
    model.defineFields({
      user_id: 'belongs_to',
      org_id: 'belongs_to',
    });
  });

  require('koru/env!./change-log')(model);

  return model;
});
