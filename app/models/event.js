define(function(require, exports, module) {
  var Val = require('koru/model/validation');
  var util = require('koru/util');
  var koru = require('koru');
  var Category = require('./category');
  var Org = require('./org');
  var Heat = require('./heat');

  var model = require('model').define(module, {
    validate: function () {
      var  heats = this.changes.heats;
      if (heats) for(var id in heats) {
        var cat = Category.findById(id);
        Val.allowAccessIf(cat.org_id === this.org_id);
        var format = heats[id];
        if (format[0] !== cat.type || ! format.slice(1).match(Category.HEAT_FORMAT_REGEX)) {
          Val.addError(this, 'heats', 'is_invalid');
        }
      }
    },

    heatTypes: function (cat_id) {
      var fmt = this.attributes.heats[cat_id];
      return fmt && fmt.replace(/[^A-Z]*/g, '');
    },
  });

  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
    org_id: 'belongs_to',
    heats: 'has-many',
    date: {type: 'date', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
    errors: 'has-many',
  });

  require('koru/env!./event')(model);

  return model;
});
