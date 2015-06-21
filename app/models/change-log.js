define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var koru = require('koru');
  var Model = require('model');

  var model = Model.define(module, {
    get parentSubject () {
      var pm = Model[this.parent];
      return new pm(pm.attrFind(this.parent_id));
    }
  });

  model.defineFields({
    createdAt: 'timestamp',
    model: 'text',
    model_id: 'id',
    parent: 'text',
    parent_id: 'id',
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
