define((require) => {
  const Val             = require('koru/model/validation');
  const ChangeLog       = require('./change-log');
  const User            = require('./user');
  const Event           = require('models/event');

  const FIELD_SPEC = {
    time: 'integer',
    scores: 'object',
    problems: 'object',
  };

  const NEW_FIELD_SPEC = {
    _id: 'id',
    event_id: 'id',
    climber_id: 'id',
    category_id: 'id',
    competitor_id: 'id',
  };

  return (Result) => {
    ChangeLog.logChanges(Result, {parent: Event});

    Result.prototype.authorize = async function (userId) {
      Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);
      await User.fetchAdminister(userId, this);
      Val.allowAccessIf(! this.event.closed);
    }

    Result.remote({
      async complete(results) {
        for (const row of results) {
          await (await Result.findById(row._id))._doSetSpeedScore(row);
        }
      },
    });
  };
});
