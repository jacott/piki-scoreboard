//;no-client-async
define((require, exports, module) => {
  'use strict';
  const koru            = require('koru');
  const util            = require('koru/util');
  const Org             = require('./org');
  const Model           = require('model');
  const Series          = require('models/series');
  const TeamType        = require('models/team-type');
  const User            = require('models/user');

  const FINALS_PREFIX = ['Final', 'Semi-final', 'Quarter-final'];

  const describeLeadFormat = (compFormatList) => {
    let qualCount = 0;
    const totalHeats = compFormatList.length;

    return util.map(compFormatList, (heat, i) => {
      if (heat === 'Q') {
        ++qualCount;
        return 'Qualifier ' + qualCount;
      }
      if (totalHeats - i > 3) {
        return 'Round of ' + heat.slice(1) + ' competitors';
      }
      return FINALS_PREFIX[totalHeats - i - 1] + ' (' + heat.slice(1) + ' competitors)';
    }).join('; ');
  };

  const describeBoulderFormat = (compFormatList) => {
    let qualCount = 0;
    const totalHeats = compFormatList.length;

    return util.map(compFormatList, (heat, i) => {
      if (heat[0] === 'Q') {
        ++qualCount;
        return 'Qualifier ' + qualCount + ' (' + heat.slice(2) + ' problems)';
      }

      const colonIndex = heat.indexOf(':');
      if (totalHeats - i > 3) {
        return `Round of ${heat.slice(1, colonIndex)} competitors (${heat.slice(colonIndex + 1)}` +
          ' problems)';
      } else {
        return FINALS_PREFIX[totalHeats - i - 1] +
          ` (${heat.slice(1, colonIndex)} competitors; ${heat.slice(colonIndex + 1)} problems)`;
      }
    }).join('; ');
  };

  class Event extends Model.BaseModel {
    static describeFormat(format) {
      const compFormatList = [];
      const re = /[QF][\d:]*/g;
      const compFormat = format.slice(1);

      let m;
      while ((m = re.exec(compFormat)) !== null) {
        compFormatList.push(m[0]);
      }
      switch (format[0]) {
      case 'L':
        return describeLeadFormat(compFormatList);
      case 'B':
        return describeBoulderFormat(compFormatList);
      case 'S':
        return 'Qualifiers; Finals';
      }
    }

    get displayName() {
      const series = this.series;
      if (series) return `${series.name} - ${this.name}`;
      return this.name;
    }

    async canJudge(userOrId) {
      const user = typeof userOrId === 'string'
            ? await User.findById(userOrId)
            : userOrId ?? await User.me();
      return user != null && ! this.closed && user.canJudge(this);
    }
  }

  Event.define({
    module,
    fields: {
      name: {type: 'text', trim: true, required: true, maxLength: 200,
             unique: {scope: ['org_id', 'series_id']}},
      org_id: 'belongs_to',
      heats: 'object',
      date: {type: 'text', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
      errors: 'object',
      closed: {type: 'boolean', boolean: 'trueOnly'},
      teamType_ids: 'has_many',
      series_id: 'belongs_to',
      ruleVersion: {type: 'number', required: 'not_null',
                    number: {integer: true, $gte: 0, $lte: 1}, default: 1},
    },
  });

  require('koru/env!./event')(Event);

  return Event;
});
