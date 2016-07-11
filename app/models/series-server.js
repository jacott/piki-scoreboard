define(function(require, exports, module) {
  const match = require('koru/match');
  const Val   = require('koru/model/validation');
  const util  = require('koru/util');
  const Heat  = require('models/heat');
  const User  = require('models/user');

  const FIELD_SPEC = {
    name: 'string',
    org_id: 'id',
    teamType_ids: ['id'],
    date: 'string',
    closed: match.or(match.boolean, match.string, match.nil),
  };

  return function (Series) {
    Series.registerObserveField('org_id');
    util.extend(Series.prototype, {
      authorize(userId) {
        User.fetchAdminister(userId, this);

        const changes = this.changes;

        Val.assertDocChanges(this, FIELD_SPEC);

        if (changes.hasOwnProperty('closed'))
          Val.allowAccessIf(Object.keys(changes).length === 1);
        else
          Val.allowAccessIf(! this.closed &&
                            (this.$isNewRecord() || ! changes.hasOwnProperty('org_id')));

      },
    });

    Series.remote({
      results(series_id) {
        const series = Series.findById(series_id);
        const ans = [];
        let ce, ce_id, cc, cc_id, fmt;
        Series.db.query(`select event_id, climber_id, category_id, scores, e.heats->>category_id as fmt
from "Result", "Event" as e
where e.series_id = $1 and e._id = event_id order by event_id, category_id
`,
                        [series_id])
          .forEach(row => {
            if (cc_id !== row.category_id || ce_id !== row.event_id) {
              sumCat();
              cc_id = row.category_id;
              fmt = row.fmt;
              cc = [];
            }
            if (ce_id !== row.event_id) {
              ce && ans.push(ce);
              ce_id = row.event_id;
              ce = {event_id: ce_id, cats: []};
            }

            cc.push(row);
          });
        if (ce) {
          sumCat();
          ans.push(ce);
        }
        return ans;

        function sumCat() {
          if (! cc) return;

          const heat = new Heat(-1, fmt);

          cc && ce.cats.push({
            category_id: cc_id,
            fmt,
            results: new Heat(-1, fmt).sort(cc).map(row => [row.climber_id, row.sPoints]),
          });
        }
      }
    });
  };
});
