define(function(require, exports, module) {
  const koru     = require('koru');
  const Val      = require('koru/model/validation');
  const util     = require('koru/util');
  const TeamType = require('models/team-type');
  const Category = require('./category');
  const Heat     = require('./heat');
  const Org      = require('./org');

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
      return this.attributes.heats[cat_id];
    },
  });

  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
    org_id: 'belongs_to',
    heats: 'object',
    date: {type: 'text', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
    errors: 'object',
    closed: {type: 'boolean', boolean: 'trueOnly'},
    teamType_ids: 'has_many',
  });

  model.describeFormat = function (format) {
    var compFormatList = [];
    var re = /[QF][\d:]*/g;
    var compFormat = format.slice(1);

    var m;
    while ((m = re.exec(compFormat)) !== null) {
      compFormatList.push(m[0]);
    }
    if (format[0] === 'L')
      return describeLeadFormat(compFormatList);
    else
      return describeBoulderFormat(compFormatList);
  };

  var FINALS_PREFIX = ['Final', 'Semi-final', 'Quarter-final'];

  function describeLeadFormat(compFormatList) {
    var qualCount = 0;
    var totalHeats = compFormatList.length;

    return util.map(compFormatList, function (heat, i) {
      if (heat === 'Q') {
        ++qualCount;
        return 'Qualifier ' + qualCount;
      }
      if (totalHeats - i > 3) {
        return 'Round of ' + heat.slice(1) + ' competitors';
      }
      return FINALS_PREFIX[totalHeats - i - 1] + ' ('+heat.slice(1) + ' competitors)';
    }).join('; ');
  }

  function describeBoulderFormat(compFormatList) {
    var qualCount = 0;
    var totalHeats = compFormatList.length;

    return util.map(compFormatList, function (heat, i) {
      if (heat[0] === 'Q') {
        ++qualCount;
        return 'Qualifier ' + qualCount + ' ('+ heat.slice(2) + ' problems)';
      }

      var colonIndex = heat.indexOf(':');
      if (totalHeats - i > 3) {
        return 'Round of ' + heat.slice(1, colonIndex) + ' competitors (' + heat.slice(colonIndex+1) + ' problems)';
      } else {
        return FINALS_PREFIX[totalHeats - i - 1] + ' ('+heat.slice(1, colonIndex) + ' competitors; ' +
          heat.slice(colonIndex+1) + ' problems)';
      }
    }).join('; ');
  }

  require('koru/env!./event')(model);

  return model;
});
