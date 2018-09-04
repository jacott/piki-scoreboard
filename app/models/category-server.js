define((require, exports, module)=>{
  const Model           = require('koru/model');
  const Val             = require('koru/model/validation');
  const util            = require('koru/util');
  const User            = require('./user');

  const FIELD_SPEC = {
    name: 'string',
    group: 'string',
    shortName: 'string',
    gender: 'string',
    type: 'string',
    heatFormat: 'string',
    minAge: 'integer',
    maxAge: 'integer',
  };

  const NEW_FIELD_SPEC = {
    _id: 'id',
    org_id: 'id',
  };

  return Category =>{
    Category.registerObserveField('org_id');

    util.merge(Category.prototype, {
      authorize(userId, options) {
        Val.assertDocChanges(this, FIELD_SPEC, NEW_FIELD_SPEC);
        User.fetchAdminister(userId, this);

        if (options && options.remove) {
          Val.allowAccessIf(! Model.Competitor.exists({category_ids: this._id}));
        }
      },
    });
  };
});
